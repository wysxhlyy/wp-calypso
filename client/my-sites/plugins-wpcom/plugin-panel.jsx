/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import {
	includes,
	get,
	overSome
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

const filterPlugins = category => plugin => {
	if ( category && category !== 'all' ) {
		return plugin.category === filterToCategory[ category ];
	}

	return true;
};

const searchPlugins = search => overSome(
	( { name } ) => {
		return includes( name.toLowerCase(), search.toLowerCase() );
	},
	( { description } ) => {
		return includes( description.toLowerCase(), search.toLowerCase() );
	}
);

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
			siteSlug,
			category = 'all',
			search = '',
			doSearch,
			translate,
			hasBusiness,
			hasPremium,
			standardPluginsLink,
			purchaseLink
		} = this.props;

		const interpolateLink = linkInterpolator( { siteSlug } );

		const searchByCategory = searchPlugins( search );
		const filterByCategory = filterPlugins( category );

		const standardPlugins = defaultStandardPlugins
			.filter( searchByCategory )
			.filter( filterByCategory )
			.map( interpolateLink );

		const premiumPlugins = defaultPremiumPlugins.map( interpolateLink );
		const businessPlugins = defaultBusinessPlugins.map( interpolateLink );

		return (
			<div className="plugins-wpcom__panel">
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
				<Card className="plugins-wpcom__panel-footer" href={ standardPluginsLink }>
					{ translate( 'View all standard plugins' ) }
				</Card>
				<PremiumPluginsPanel plugins={ premiumPlugins } isActive={ hasPremium } { ...{ purchaseLink } } />
				<BusinessPluginsPanel plugins={ businessPlugins } isActive={ hasBusiness } { ...{ purchaseLink } } />
			</div>
		);
	}
} );

const mapStateToProps = state => {
	const plan = get( getSelectedSite( state ), 'plan', {} );
	const hasBusiness = isBusiness( plan ) || isEnterprise( plan );
	const siteSlug = getSiteSlug( state, getSelectedSiteId( state ) );

	return {
		plan,
		hasBusiness,
		hasPremium: hasBusiness || isPremium( plan ),
		siteSlug: getSiteSlug( state, getSelectedSiteId( state ) ),
		standardPluginsLink: `/plugins/standard/${ siteSlug }`,
		purchaseLink: `/plans/${ siteSlug }`
	};
};

export default connect( mapStateToProps )( localize( urlSearch( PluginPanel ) ) );
