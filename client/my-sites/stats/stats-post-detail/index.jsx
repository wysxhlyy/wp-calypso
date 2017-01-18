/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import page from 'page';
import { localize } from 'i18n-calypso';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import observe from 'lib/mixins/data-observe';
import Emojify from 'components/emojify';
import PostSummary from '../stats-post-summary';
import PostMonths from '../stats-detail-months';
import PostWeeks from '../stats-detail-weeks';
import HeaderCake from 'components/header-cake';
import { decodeEntities } from 'lib/formatting';
import Main from 'components/main';
import StatsFirstView from '../stats-first-view';
import PostLikes from '../stats-post-likes';
import QueryPostStats from 'components/data/query-post-stats';
import NoViewsPlaceholder from './no-views-placeholder';
import { getPostStat, isRequestingPostStats } from 'state/stats/posts/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';

const StatsPostDetail = React.createClass( {
	mixins: [ observe( 'postViewsList' ) ],

	propTypes: {
		path: PropTypes.string,
		postViewsList: PropTypes.object
	},

	goBack() {
		const pathParts = this.props.path.split( '/' );
		const defaultBack = '/stats/' + pathParts[ pathParts.length - 1 ];

		page( this.props.context.prevPath || defaultBack );
	},

	componentDidMount() {
		window.scrollTo( 0, 0 );
	},

	render() {
		const { isRequesting, countViews, postId, postViewsList, siteId, translate } = this.props;
		let title;
		const post = postViewsList.response.post;
		const isLoading = postViewsList.isLoading();
		const postOnRecord = post && post.post_title !== null;

		if ( postOnRecord ) {
			if ( typeof post.post_title === 'string' && post.post_title.length ) {
				title = <Emojify>{ decodeEntities( post.post_title ) }</Emojify>;
			}
		}

		if ( ! postOnRecord && ! isLoading ) {
			title = translate( 'We don\'t have that post on record yet.' );
		}

		return (
			<Main wideLayout={ true }>
				<QueryPostStats siteId={ siteId } postId={ postId } />

				{ ! isRequesting && countViews === 0 && <NoViewsPlaceholder /> }

				<StatsFirstView />

				<HeaderCake onClick={ this.goBack }>
					{ title }
				</HeaderCake>

				<PostSummary siteId={ siteId } postId={ postId } />

				{ !! postId && <PostLikes siteId={ siteId } postId={ postId } /> }

				<PostMonths
					dataKey="years"
					title={ translate( 'Months and Years' ) }
					total={ translate( 'Total' ) }
					postViewsList={ postViewsList } />

				<PostMonths
					dataKey="averages"
					title={ translate( 'Average per Day' ) }
					total={ translate( 'Overall' ) }
					postViewsList={ postViewsList } />

				<PostWeeks postViewsList={ postViewsList } />
			</Main>
		);
	}
} );

const connectComponent = connect(
	( state, { postId } ) => {
		const siteId = getSelectedSiteId( state );
		return {
			countViews: getPostStat( state, siteId, postId, 'views' ),
			isRequesting: isRequestingPostStats( state, siteId, postId ),
			siteId
		};
	}
);

export default flowRight(
	connectComponent,
	localize,
)( StatsPostDetail );
