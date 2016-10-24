/**
 * External dependencies
 */
import { connect } from 'react-redux';
import page from 'page';
import React from 'react';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import PlansGrid from './plans-grid';
import { getPlansBySite } from 'state/sites/plans/selectors';
import observe from 'lib/mixins/data-observe';
import { recordTracksEvent } from 'state/analytics/actions';
import { getCurrentUser } from 'state/current-user/selectors';
import * as upgradesActions from 'lib/upgrades/actions';
import { userCan } from 'lib/site/utils';
import { selectPlanInAdvance, goBackToWpAdmin, completeFlow } from 'state/jetpack-connect/actions';
import QueryPlans from 'components/data/query-plans';
import QuerySitePlans from 'components/data/query-site-plans';
import { isRequestingPlans, getPlanBySlug } from 'state/plans/selectors';
import {
	getFlowType,
	getSiteSelectedPlan,
	getGlobalSelectedPlan,
	getAuthorizationData,
	isCalypsoStartedConnection
} from 'state/jetpack-connect/selectors';

const CALYPSO_REDIRECTION_PAGE = '/posts/';
const CALYPSO_PLANS_PAGE = '/plans/my-plan/';

const Plans = React.createClass( {
	mixins: [ observe( 'sites' ) ],

	propTypes: {
		sites: React.PropTypes.object,
		sitePlans: React.PropTypes.object.isRequired,
		intervalType: React.PropTypes.string
	},

	getDefaultProps() {
		return {
			intervalType: 'yearly',
			siteSlug: '*'
		};
	},

	getInitialState: function getInitialState() {
		return {
			redirecting: false
		};
	},

	componentDidMount() {
		if ( this.hasPreSelectedPlan() ) {
			this.autoselectPlan();
		} else {
			this.props.recordTracksEvent( 'calypso_jpc_plans_view', {
				user: this.props.userId
			} );
		}
	},

	componentDidUpdate() {
		if ( this.hasPlan( this.props.selectedSite ) && ! this.state.redirecting ) {
			this.redirect( CALYPSO_PLANS_PAGE );
		}
		if ( ! this.props.canPurchasePlans && ! this.state.redirecting ) {
			this.redirect( CALYPSO_REDIRECTION_PAGE );
		}

		if ( ! this.props.isRequestingPlans &&
			( this.props.flowType === 'pro' || this.props.flowType === 'premium' ) &&
			! this.state.redirecting ) {
			return this.autoselectPlan();
		}
	},

	redirect( path ) {
		page.redirect( path + this.props.selectedSite.slug );
		this.setState( { redirecting: true } );
		this.props.completeFlow();
	},

	hasPreSelectedPlan() {
		if ( this.props.flowType === 'pro' || this.props.flowType === 'premium' || this.props.flowType === 'personal' ) {
			return true;
		}

		return !! this.props.selectedPlan;
	},

	hasPlan( site ) {
		return site &&
			site.plan &&
			( site.plan.product_slug === 'jetpack_business' || site.plan.product_slug === 'jetpack_premium' );
	},

	autoselectPlan() {
		if ( ! this.props.showFirst ) {
			if ( this.props.flowType === 'pro' || this.props.selectedPlan === 'jetpack_business' ) {
				const plan = this.props.getPlanBySlug( 'jetpack_business' );
				if ( plan ) {
					this.selectPlan( plan );
					return;
				}
			}
			if ( this.props.flowType === 'premium' || this.props.selectedPlan === 'jetpack_premium' ) {
				const plan = this.props.getPlanBySlug( 'jetpack_premium' );
				if ( plan ) {
					this.selectPlan( plan );
					return;
				}
			}
			if ( this.props.selectedPlan === 'free' ||
				this.props.selectedPlan === 'jetpack_free' ) {
				this.selectFreeJetpackPlan();
			}
		}
	},

	selectFreeJetpackPlan() {
		// clears whatever we had stored in local cache
		this.props.selectPlanInAdvance( null, this.props.selectedSite.slug );
		this.props.recordTracksEvent( 'calypso_jpc_plans_submit_free', {
			user: this.props.userId
		} );
		if ( this.props.calypsoStartedConnection ) {
			this.redirect( CALYPSO_REDIRECTION_PAGE );
		} else {
			const { queryObject } = this.props.jetpackConnectAuthorize;
			this.props.goBackToWpAdmin( queryObject.redirect_after_auth );
			this.setState( { redirecting: true } );
			this.props.completeFlow();
		}
	},

	selectPlan( cartItem ) {
		const checkoutPath = `/checkout/${ this.props.selectedSite.slug }`;
		// clears whatever we had stored in local cache
		this.props.selectPlanInAdvance( null, this.props.selectedSite.slug );

		if ( cartItem.product_slug === 'jetpack_free' ) {
			return this.selectFreeJetpackPlan();
		}
		if ( cartItem.product_slug === 'jetpack_premium' ) {
			this.props.recordTracksEvent( 'calypso_jpc_plans_submit_99', {
				user: this.props.userId
			} );
		}
		if ( cartItem.product_slug === 'jetpack_business' ) {
			this.props.recordTracksEvent( 'calypso_jpc_plans_submit_299', {
				user: this.props.userId
			} );
		}
		upgradesActions.addItem( cartItem );
		this.setState( { redirecting: true } );
		this.props.completeFlow();
		page( checkoutPath );
	},

	storeSelectedPlan( cartItem ) {
		this.props.recordTracksEvent( 'calypso_jpc_plans_store_plan', {
			user: this.props.userId,
			plan: cartItem ? cartItem.product_slug : 'free'
		} );
		this.props.selectPlanInAdvance(
			cartItem ? cartItem.product_slug : 'free',
			this.props.siteSlug,
		);
	},

	render() {
		if ( this.state.redirecting ||
			this.hasPreSelectedPlan() ||
			( ! this.props.showFirst && ! this.props.canPurchasePlans ) ||
			( ! this.props.showFirst && this.hasPlan( this.props.selectedSite ) )
		) {
			return null;
		}

		return (
			<div>
				<QueryPlans />
				{ this.props.selectedSite
					? <QuerySitePlans siteId={ this.props.selectedSite.ID } />
					: null
				}
				<PlansGrid
					{ ...this.props }
					onSelect={ this.props.showFirst || this.props.isLanding ? this.storeSelectedPlan : this.selectPlan } />
			</div>
		);
	}
} );

export default connect(
	( state, props ) => {
		const user = getCurrentUser( state );
		const selectedSite = props.sites ? props.sites.getSelectedSite() : null;
		const selectedSiteSlug = selectedSite ? selectedSite.slug : null;

		const selectedPlan = getSiteSelectedPlan( state, selectedSiteSlug ) || getGlobalSelectedPlan( state );
		const searchPlanBySlug = ( planSlug ) => {
			return getPlanBySlug( state, planSlug );
		};

		return {
			selectedSite,
			sitePlans: getPlansBySite( state, selectedSite ),
			jetpackConnectAuthorize: getAuthorizationData( state ),
			userId: user ? user.ID : null,
			canPurchasePlans: selectedSite ? userCan( 'manage_options', selectedSite ) : true,
			flowType: getFlowType( state, selectedSite && selectedSite.slug ),
			isRequestingPlans: isRequestingPlans( state ),
			getPlanBySlug: searchPlanBySlug,
			calypsoStartedConnection: selectedSite ? isCalypsoStartedConnection( state, selectedSiteSlug ) : null,
			selectedPlan
		};
	},
	( dispatch ) => {
		return Object.assign( {},
			bindActionCreators( { goBackToWpAdmin, completeFlow, selectPlanInAdvance }, dispatch ),
			{
				recordTracksEvent( eventName, props ) {
					dispatch( recordTracksEvent( eventName, props ) );
				}
			}
		);
	}
)( Plans );
