/**
 * External dependencies
 */
import { every, get, includes, keyBy, map, omit, some } from 'lodash';

/**
 * Internal dependencies
 */
import PaginatedQueryManager from '../paginated';
import ThemeQueryKey from './key';
import { isPremium } from './util';
import { DEFAULT_THEME_QUERY } from './constants';
import { PAGINATION_QUERY_KEYS } from 'lib/query-manager/paginated/constants';

const SEARCH_TAXONOMIES = [ 'subject', 'feature', 'color', 'style', 'column', 'layout' ];

/**
 * ThemeQueryManager manages themes which can be queried
 */
export default class ThemeQueryManager extends PaginatedQueryManager {
	/**
	 * Returns true if the theme matches the given query, or false otherwise.
	 *
	 * @param  {Object}  query Query object
	 * @param  {Object}  theme Item to consider
	 * @return {Boolean}       Whether theme matches query
	 */

	matches( query, theme ) {
		const queryWithDefaults = { ...DEFAULT_THEME_QUERY, ...query };
		return every( queryWithDefaults, ( value, key ) => {
			switch ( key ) {
				case 'search':
					if ( ! value ) {
						return true;
					}

					const search = value.toLowerCase();

					const foundInTaxonomies = some( SEARCH_TAXONOMIES, ( taxonomy ) => (
						theme.taxonomies && some( theme.taxonomies[ 'theme_' + taxonomy ], ( { name } ) => (
							includes( name.toLowerCase(), search )
						) )
					) );

					return foundInTaxonomies || (
						( theme.name && includes( theme.name.toLowerCase(), search ) ) ||
						( theme.author && includes( theme.author.toLowerCase(), search ) ) ||
						( theme.descriptionLong && includes( theme.descriptionLong.toLowerCase(), search ) )
					);

				case 'filters':
					// TODO: Change filters object shape to be more like post's terms, i.e.
					// { color: 'blue,red', feature: 'post-slider' }
					const filters = value.split( ',' );
					return every( filters, ( filter ) => (
						some( theme.taxonomies, ( terms ) => (
							some( terms, { slug: filter } )
						) )
					) );

				case 'tier':
					if ( ! value ) {
						return true;
					}
					const queryingForPremium = value === 'premium';
					return queryingForPremium === isPremium( theme );
			}

			return true;
		} );
	}

	/**
	 * Signal that an item(s) has been received for tracking. Optionally
	 * specify that items received are intended for patch application, or that
	 * they are associated with a query. This function does not mutate the
	 * instance state. Instead, it returns a new instance of QueryManager if
	 * the tracked items have been modified, or the current instance otherwise.
	 *
	 * @param  {(Array|Object)} items              Item(s) to be received
	 * @param  {Object}         options            Options for receive
	 * @param  {Boolean}        options.patch      Apply changes as partial
	 * @param  {Object}         options.query      Query set to set or replace
	 * @param  {Boolean}        options.mergeQuery Add to existing query set
	 * @param  {Number}         options.found      Total found items for query
	 * @return {QueryManager}                      New instance if changed, or
	 *                                             same instance otherwise
	 */
	receive( items = [], options = {} ) {
		// When tracking queries, remove pagination query arguments. These are
		// simulated in `PaginatedQueryManager.prototype.getItems`.
		let modifiedOptions = options;
		if ( options.query ) {
			modifiedOptions = Object.assign( {
				mergeQuery: true
			}, options, {
				query: omit( options.query, PAGINATION_QUERY_KEYS )
			} );
		}

		const keyedItems = keyBy( items, this.options.itemKey );
		const nextItems = {
			...( this.data.items ),
			...keyedItems
		};
		let nextQueries = this.data.queries;

		const receivedQueryKey = this.constructor.QueryKey.stringify( modifiedOptions.query );

		let nextQueryFound;
		if ( options.found >= 0 && options.found !== get( nextQueries, [ receivedQueryKey, 'found' ] ) ) {
			nextQueryFound = options.found;
		}

		// If original query does not have any pagination keys, we don't need
		// to update its item set
		if ( ! this.constructor.hasQueryPaginationKeys( options.query ) ) {
			return new this.constructor(
				Object.assign( {}, this.data, {
					items: nextItems
				} ),
				this.options
			);
		}

		const page = options.query.page || this.constructor.DEFAULT_QUERY.page;
		const perPage = options.query.number || this.constructor.DEFAULT_QUERY.number;
		const startOffset = ( page - 1 ) * perPage;

		// Old query items
		const nextReceivedQuery = Object.assign( {}, nextQueries[ receivedQueryKey ] );
		const receivedItemKeys = map( keyedItems, this.options.itemKey );
		// In reality, we need to splice here
		const nextItemKeys = [
			...get( nextReceivedQuery, 'itemKeys', [] ),
			...receivedItemKeys
		];

		nextQueries = {
			...nextQueries,
			[ receivedQueryKey ]: {
				itemKeys: nextItemKeys,
				found: nextQueryFound
			}
		};

		console.log( nextReceivedQuery, items, this.options.itemKey, receivedItemKeys, nextQueries, new this.constructor(
			Object.assign( {}, this.data, {
				items: nextItems,
				queries: nextQueries
			} ),
			this.options
		) );

		// Receive the updated manager, passing a modified set of options to
		// exclude pagination keys, and to indicate appending query.
		//const nextManager = super.receive( items, options );

		// If manager is the same instance, assume no changes have been made
		//if ( this === nextManager ) {
		//	return nextManager;
		//}

		return new this.constructor(
			Object.assign( {}, this.data, {
				items: nextItems,
				queries: nextQueries
			} ),
			this.options
		);
	}
}

ThemeQueryManager.QueryKey = ThemeQueryKey;

ThemeQueryManager.DEFAULT_QUERY = DEFAULT_THEME_QUERY;
