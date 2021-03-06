/**
 * External dependencies
 */
import page from 'page';
import React from 'react';
import debugFactory from 'debug';

/**
 * Internal dependencies
 */
import StatsPeriodNavigation from './stats-period-navigation';
import Main from 'components/main';
import StatsNavigation from './stats-navigation';
import SidebarNavigation from 'my-sites/sidebar-navigation';
import DatePicker from './stats-date-picker';
import Countries from './stats-countries';
import ChartTabs from './stats-chart-tabs';
import StatsConnectedModule from './stats-module/connected-list';
import statsStrings from './stats-strings';
import titlecase from 'to-title-case';
import analytics from 'lib/analytics';
import StatsFirstView from './stats-first-view';
import config from 'config';

const debug = debugFactory( 'calypso:stats:site' );

module.exports = React.createClass( {
	displayName: 'StatsSite',

	getInitialState: function() {
		const scrollPosition = this.props.context.state.scrollPosition || 0;

		return {
			date: this.props.date,
			chartDate: this.props.date,
			chartTab: this.props.chartTab,
			tabSwitched: false,
			period: this.props.period.period,
			scrollPosition: scrollPosition
		};
	},

	componentWillReceiveProps: function( nextProps ) {
		const newDate = this.moment( nextProps.date );
		const newState = {
			date: newDate,
			chartDate: newDate
		};

		if ( ! this.state.tabSwitched || ( this.state.period !== nextProps.period.period ) ) {
			newState.chartTab = nextProps.chartTab;
			newState.period = nextProps.period.period;
			newState.tabSwitched = true;
		}

		this.setState( newState );
	},

	scrollTop: function() {
		if ( window.pageYOffset ) {
			return window.pageYOffset;
		}
		return document.documentElement.clientHeight ? document.documentElement.scrollTop : document.body.scrollTop;
	},

	componentDidMount: function() {
		const scrollPosition = this.state.scrollPosition;

		setTimeout( function() {
			window.scrollTo( 0, scrollPosition );
		} );
	},

	updateScrollPosition: function() {
		this.props.context.state.scrollPosition = this.scrollTop();
		this.props.context.save();
	},

	// When user clicks on a bar, set the date to the bar's period
	chartBarClick: function( bar ) {
		page.redirect( this.props.path + '?startDate=' + bar.period );
	},

	barClick: function( bar ) {
		analytics.ga.recordEvent( 'Stats', 'Clicked Chart Bar' );
		page.redirect( this.props.path + '?startDate=' + bar.data.period );
	},

	switchChart: function( tab ) {
		if ( ! tab.loading && tab.attr !== this.state.chartTab ) {
			analytics.ga.recordEvent( 'Stats', 'Clicked ' + titlecase( tab.attr ) + ' Tab' );
			this.setState( {
				chartTab: tab.attr,
				tabSwitched: true
			} );
		}
	},

	render: function() {
		const site = this.props.sites.getSite( this.props.siteId );
		const charts = this.props.charts();
		const queryDate = this.props.date.format( 'YYYY-MM-DD' );
		const { period, endOf } = this.props.period;
		const moduleStrings = statsStrings();
		let videoList;
		let podcastList;

		const query = {
			period: period,
			date: endOf.format( 'YYYY-MM-DD' )
		};

		debug( 'Rendering site stats component', this.props );

		if ( site ) {
			// Video plays, and tags and categories are not supported in JetPack Stats
			if ( ! site.jetpack ) {
				videoList = (
					<StatsConnectedModule
						path="videoplays"
						moduleStrings={ moduleStrings.videoplays }
						period={ this.props.period }
						date={ queryDate }
						query={ query }
						statType="statsVideoPlays"
						showSummaryLink
					/>
				);
			}
			if ( config.isEnabled( 'manage/stats/podcasts' ) && site.options.podcasting_archive ) {
				podcastList = (
					<StatsConnectedModule
						path="podcastdownloads"
						moduleStrings={ moduleStrings.podcastdownloads }
						period={ this.props.period }
						date={ queryDate }
						query={ query }
						statType="statsPodcastDownloads"
						showSummaryLink
					/>
				);
			}
		}

		return (
			<Main wideLayout={ true }>
				<StatsFirstView />
				<SidebarNavigation />
				<StatsNavigation
					section={ period }
					site={ site } />
				<div id="my-stats-content">
					<ChartTabs
						visitsList={ this.props.visitsList }
						activeTabVisitsList={ this.props.activeTabVisitsList }
						barClick={ this.barClick }
						switchTab={ this.switchChart }
						charts={ charts }
						queryDate={ queryDate }
						period={ this.props.period }
						chartTab={ this.state.chartTab } />
					<StatsPeriodNavigation
						date={ this.props.date }
						period={ this.props.period.period }
						url={ `/stats/${ this.props.period.period }/${ site.slug }` }
					>
						<DatePicker
							period={ this.props.period.period }
							date={ this.props.date } />
					</StatsPeriodNavigation>
					<div className="stats__module-list is-events">
						<div className="stats__module-column">
							<StatsConnectedModule
								path="posts"
								moduleStrings={ moduleStrings.posts }
								period={ this.props.period }
								query={ query }
								date={ queryDate }
								statType="statsTopPosts"
								showSummaryLink />
							<StatsConnectedModule
								path="referrers"
								moduleStrings={ moduleStrings.referrers }
								period={ this.props.period }
								query={ query }
								date={ queryDate }
								statType="statsReferrers"
								showSummaryLink />
							<StatsConnectedModule
								path="clicks"
								moduleStrings={ moduleStrings.clicks }
								period={ this.props.period }
								query={ query }
								date={ queryDate }
								statType="statsClicks"
								showSummaryLink />
							<StatsConnectedModule
								path="authors"
								moduleStrings={ moduleStrings.authors }
								period={ this.props.period }
								date={ queryDate }
								query={ query }
								statType="statsTopAuthors"
								className="stats__author-views"
								showSummaryLink />
						</div>
						<div className="stats__module-column">
							<Countries
								path="countries"
								period={ this.props.period }
								query={ query }
								summary={ false } />
							<StatsConnectedModule
								path="searchterms"
								moduleStrings={ moduleStrings.search }
								period={ this.props.period }
								date={ queryDate }
								query={ query }
								statType="statsSearchTerms"
								showSummaryLink />
							{ videoList }
							{ podcastList }
						</div>
					</div>
				</div>
			</Main>
		);
	}
} );
