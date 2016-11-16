/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import {
	includes,
	get
} from 'lodash';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import urlSearch from 'lib/mixins/url-search/component';
import Card from 'components/card';
import SectionNavigation from 'components/section-nav';
import NavTabs from 'components/section-nav/tabs';
import NavItem from 'components/section-nav/item';
import Search from 'components/search';
import {
	getSelectedSite,
	getSelectedSiteId
} from 'state/ui/selectors';
import { getSiteSlug } from 'state/sites/selectors';
import {
	isPremium,
	isBusiness,
	isEnterprise
} from 'lib/products-values';
import StandardPluginsPanel from './standard-plugins-panel';
import PremiumPluginsPanel from './premium-plugins-panel';
import BusinessPluginsPanel from './business-plugins-panel';
import PageViewTracker from 'lib/analytics/page-view-tracker';
import {
	defaultStandardPlugins,
	defaultPremiumPlugins,
	defaultBusinessPlugins
} from './default-plugins';

/*
 *replacements e.g. { siteSlug: 'mytestblog.wordpress.com', siteId: 12345 }
 */
const linkInterpolator = replacements => plugin => {
	const { descriptionLink: link } = plugin;
	const descriptionLink = Object
		.keys( replacements )
		.reduce(
			( s, r ) => s.replace( new RegExp( `{${ r }}` ), replacements[ r ] ),
			link
		);

	return { ...plugin, descriptionLink };
};

const filterToCategory = {
	traffic: 'Traffic Growth'
};

export const PluginPanel = React.createClass( {
	getFilters() {
		const { translate, siteSlug } = this.props;
		const siteFilter = siteSlug ? '/' + siteSlug : '';
		const basePath = '/plugins/category';

		return [
			{
				title: translate( 'All', { context: 'Filter label for plugins list' } ),
				path: '/plugins' + siteFilter,
				id: 'all'
			},
			{
				title: translate( 'Traffic Growth', { context: 'Filter label for plugins list' } ),
				path: basePath + '/traffic' + siteFilter,
				id: 'traffic'
			},
			{
				title: translate( 'Content', { context: 'Filter label for plugins list' } ),
				path: basePath + '/content' + siteFilter,
				id: 'content'
			},
			{
				title: translate( 'Appearance', { context: 'Filter label for plugins list' } ),
				path: basePath + '/appearance' + siteFilter,
				id: 'appearance'
			},
			{
				title: translate( 'Security', { context: 'Filter label for plugins list' } ),
				path: basePath + '/security' + siteFilter,
				id: 'security'
			}
		];
	},

	render() {
		const {
			plan,
			siteSlug,
			category,
			search,
			doSearch,
			translate
		} = this.props;

		const standardPluginsLink = `/plugins/standard/${ siteSlug }`;
		const purchaseLink = `/plans/${ siteSlug }`;

		const hasBusiness = isBusiness( plan ) || isEnterprise( plan );
		const hasPremium = hasBusiness || isPremium( plan );

		const interpolateLink = linkInterpolator( { siteSlug } );

		let standardPlugins = defaultStandardPlugins.map( interpolateLink );
		if ( category ) {
			const filterPlugins = plugin => {
				return plugin.category === filterToCategory[ category ];
			};

			standardPlugins = standardPlugins.filter( filterPlugins );
		}

		if ( search ) {
			const searchPlugins = plugin => {
				return includes( plugin.name.toLowerCase(), search.toLowerCase() ) ||
					includes( plugin.description.toLowerCase(), search.toLowerCase() );
			};

			standardPlugins = standardPlugins.filter( searchPlugins );
		}

		const premiumPlugins = defaultPremiumPlugins.map( interpolateLink );
		const businessPlugins = defaultBusinessPlugins.map( interpolateLink );

		return (
			<div className="wpcom-plugin-panel">
				<PageViewTracker path="/plugins/:site" title="Plugins > WPCOM Site" />
				<SectionNavigation>
					<NavTabs>
						{ this.getFilters().map( filterItem => (
							<NavItem
								key={ filterItem.id }
								path={ filterItem.path }
								selected={ filterItem.id === category }>
								{ filterItem.title }
							</NavItem>
						) ) }
					</NavTabs>
					<Search pinned fitsContainer onSearch={ doSearch } placeholder={ translate( 'Search' ) } delaySearch />
				</SectionNavigation>
				<Card compact className="plugins-wpcom__header">
					<div className="plugins-wpcom__header-text">
						<span className="plugins-wpcom__header-title">{ translate( 'Included Plugins' ) }</span>
						<span className="plugins-wpcom__header-subtitle">
							{ translate( 'Every plan includes a set of plugins specially tailored to supercharge your site.' ) }
						</span>
					</div>
					<img className="plugins-wpcom__header-image" src="/calypso/images/plugins/plugins_hero.svg" />
				</Card>
				<StandardPluginsPanel plugins={ standardPlugins } displayCount={ 9 } />
				<Card className="wpcom-plugin-panel__panel-footer" href={ standardPluginsLink }>
					{ translate( 'View all standard plugins' ) }
				</Card>
				<PremiumPluginsPanel plugins={ premiumPlugins } isActive={ hasPremium } { ...{ purchaseLink } } />
				<BusinessPluginsPanel plugins={ businessPlugins } isActive={ hasBusiness } { ...{ purchaseLink } } />
			</div>
		);
	}
} );

const mapStateToProps = state => ( {
	plan: get( getSelectedSite( state ), 'plan', {} ),
	siteSlug: getSiteSlug( state, getSelectedSiteId( state ) )
} );

export default connect( mapStateToProps )( localize( urlSearch( PluginPanel ) ) );
