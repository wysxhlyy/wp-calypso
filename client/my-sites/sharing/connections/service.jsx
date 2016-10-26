/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { filter, some } from 'lodash';

/**
 * Internal dependencies
 */
var ServiceTip = require( './service-tip' ),
	ServiceDescription = require( './service-description' ),
	ServiceExamples = require( './service-examples' ),
	ServiceAction = require( './service-action' ),
	ServiceConnectedAccounts = require( './service-connected-accounts' ),
	notices = require( 'notices' ),
	observe = require( 'lib/mixins/data-observe' ),
	sites = require( 'lib/sites-list' )(),
	serviceConnections = require( './service-connections' ),
	analytics = require( 'lib/analytics' ),
	FoldableCard = require( 'components/foldable-card' ),
	SocialLogo = require( 'components/social-logo' );

import AccountDialog from './account-dialog';
import {
	createSiteConnection,
	deleteSiteConnection,
	fetchConnections,
	updateSiteConnection,
} from 'state/sharing/publicize/actions';
import { getConnectionsBySiteId, isFetchingConnections } from 'state/sharing/publicize/selectors';
import { getSelectedSiteId } from 'state/ui/selectors';
import PopupMonitor from 'lib/popup-monitor';
import { warningNotice } from 'state/notices/actions';

const SharingService = React.createClass( {
	displayName: 'SharingService',

	propTypes: {
		site: React.PropTypes.object,                    // The site for which connections are created
		user: React.PropTypes.object,                    // A user object
		service: React.PropTypes.object.isRequired,      // The single service object
		connections: React.PropTypes.object,             // A collections-list instance
	},

	mixins: [ observe( 'connections' ) ],

	getInitialState: function() {
		return {
			isOpen: false,          // The service is visually opened
			isConnecting: false,    // A pending connection is awaiting authorization
			isDisconnecting: false, // A pending disconnection is awaiting completion
			isRefreshing: false,    // A pending refresh is awaiting completion
			isSelectingAccount: false,
		};
	},

	getDefaultProps: function() {
		return {
			onAddConnection: function() {},
			onRemoveConnection: function() {},
			onRefreshConnection: function() {},
			onToggleSitewideConnection: function() {}
		};
	},

	componentWillUnmount: function() {
		this.props.connections.off( 'create:success', this.onConnectionSuccess );
		this.props.connections.off( 'create:error', this.onConnectionError );
		this.props.connections.off( 'destroy:success', this.onDisconnectionSuccess );
		this.props.connections.off( 'destroy:error', this.onDisconnectionError );
		this.props.connections.off( 'refresh:success', this.onRefreshSuccess );
		this.props.connections.off( 'refresh:error', this.onRefreshError );
	},

	onConnectionSuccess: function() {
		this.setState( { isConnecting: false } );
		this.props.connections.off( 'create:error', this.onConnectionError );

		notices.success( this.translate( 'The %(service)s account was successfully connected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize connection confirmation'
		} ) );

		if ( ! this.state.isOpen ) {
			this.setState( { isOpen: true } );
		}
	},

	onConnectionError: function( reason ) {
		this.setState( { isConnecting: false } );
		this.props.connections.off( 'create:success', this.onConnectionSuccess );

		if ( reason && reason.cancel ) {
			notices.warning( this.translate( 'The %(service)s connection could not be made because no account was selected.', {
				args: { service: this.props.service.label },
				context: 'Sharing: Publicize connection confirmation'
			} ) );
		} else if ( reason && reason.connected ) {
			notices.warning( this.translate( 'The %(service)s connection could not be made because all available accounts are already connected.', {
				args: { service: this.props.service.label },
				context: 'Sharing: Publicize connection confirmation'
			} ) );
		} else {
			notices.error( this.translate( 'The %(service)s connection could not be made.', {
				args: { service: this.props.service.label },
				context: 'Sharing: Publicize connection confirmation'
			} ) );
		}
	},

	onDisconnectionSuccess: function() {
		this.setState( { isDisconnecting: false } );
		this.props.connections.off( 'destroy:error', this.onDisconnectionError );

		notices.success( this.translate( 'The %(service)s account was successfully disconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize disconnection confirmation'
		} ) );
	},

	onDisconnectionError: function() {
		this.setState( { isDisconnecting: false } );
		this.props.connections.off( 'destroy:success', this.onDisconnectionSuccess );

		notices.error( this.translate( 'The %(service)s account was unable to be disconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize disconnection confirmation'
		} ) );
	},

	onRefreshSuccess: function() {
		this.setState( { isRefreshing: false } );
		this.props.connections.off( 'refresh:error', this.onRefreshError );

		notices.success( this.translate( 'The %(service)s account was successfully reconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize reconnection confirmation'
		} ) );
	},

	onRefreshError: function() {
		this.setState( { isRefreshing: false } );
		this.props.connections.off( 'refresh:success', this.onRefreshSuccess );

		notices.error( this.translate( 'The %(service)s account was unable to be reconnected.', {
			args: { service: this.props.service.label },
			context: 'Sharing: Publicize reconnection confirmation'
		} ) );
	},

	connect: function() {
		this.setState( { isConnecting: true } );
		this.props.connections.once( 'create:success', this.onConnectionSuccess );
		this.props.connections.once( 'create:error', this.onConnectionError );
		this.addConnection( this.props.service );
	},

	disconnect: function( connections ) {
		if ( 'undefined' === typeof connections ) {
			// If connections is undefined, assume that all connections for
			// this service are to be removed.
			connections = serviceConnections.getRemovableConnections( this.props.service.ID );
		}

		this.setState( { isDisconnecting: true } );
		this.props.connections.once( 'destroy:success', this.onDisconnectionSuccess );
		this.props.connections.once( 'destroy:error', this.onDisconnectionError );
		this.removeConnection( connections );
	},

	refresh: function( connection ) {
		this.setState( { isRefreshing: true } );
		this.props.connections.once( 'refresh:success', this.onRefreshSuccess );
		this.props.connections.once( 'refresh:error', this.onRefreshError );

		if ( ! connection ) {
			// When triggering a refresh from the primary action button, find
			// the first broken connection owned by the current user.
			connection = serviceConnections.getRefreshableConnections( this.props.service.ID )[ 0 ];
		}
		this.refreshConnection( connection );
	},

	performAction: function() {
		const connectionStatus = this.getConnectionStatus( this.props.service.ID );

		// Depending on current status, perform an action when user clicks the
		// service action button
		if ( 'connected' === connectionStatus && serviceConnections.getRemovableConnections( this.props.service.ID ).length ) {
			this.disconnect();
			analytics.ga.recordEvent( 'Sharing', 'Clicked Disconnect Button', this.props.service.ID );
		} else if ( 'reconnect' === connectionStatus ) {
			this.refresh();
			analytics.ga.recordEvent( 'Sharing', 'Clicked Reconnect Button', this.props.service.ID );
		} else {
			this.connect();
			analytics.ga.recordEvent( 'Sharing', 'Clicked Connect Button', this.props.service.ID );
		}
	},

	addConnection: function( service, keyringConnectionId, externalUserId = false ) {
		const _this = this,
			siteId = this.props.site.ID;

		if ( service ) {
			if ( keyringConnectionId ) {
				// Since we have a Keyring connection to work with, we can immediately
				// create or update the connection
				const keyringConnections = filter( this.props.fetchConnections( siteId ), { keyringConnectionId: keyringConnectionId } );

				if ( siteId && keyringConnections.length ) {
					// If a Keyring connection is already in use by another connection,
					// we should trigger an update. There should only be one connection,
					// so we're correct in using the connection ID from the first
					this.props.updateSiteConnection( siteId, keyringConnections[ 0 ].ID, { external_user_ID: externalUserId } );
				} else {
					this.props.createSiteConnection( siteId, keyringConnectionId, externalUserId );
				}

				analytics.ga.recordEvent( 'Sharing', 'Clicked Connect Button in Modal', this.props.service.ID );
			} else {
				// Attempt to create a new connection. If a Keyring connection ID
				// is not provided, the user will need to authorize the app
				const popupMonitor = new PopupMonitor();

				popupMonitor.open( service.connect_URL, null, 'toolbar=0,location=0,status=0,menubar=0,' +
					popupMonitor.getScreenCenterSpecs( 780, 500 ) );

				popupMonitor.once( 'close', () => {
					// When the user has finished authorizing the connection
					// (or otherwise closed the window), force a refresh
					_this.props.fetchConnections( siteId );

					// In the case that a Keyring connection doesn't exist, wait for app
					// authorization to occur, then display with the available connections
					if ( serviceConnections.didKeyringConnectionSucceed( service.ID, siteId ) && 'publicize' === service.type ) {
						_this.setState( { isSelectingAccount: true } );
					}
				} );
			}
		} else {
			// If an account wasn't selected from the dialog or the user cancels
			// the connection, the dialog should simply close
			this.props.warningNotice( this.translate( 'The connection could not be made because no account was selected.', {
				context: 'Sharing: Publicize connection confirmation'
			} ) );
			analytics.ga.recordEvent( 'Sharing', 'Clicked Cancel Button in Modal', this.props.service.ID );
		}

		// Reset active account selection
		this.setState( { isSelectingAccount: false } );
	},

	refreshConnection: function( connection ) {
		this.props.connections.refresh( connection );
	},

	removeConnection: function( connections ) {
		connections = serviceConnections.filterConnectionsToRemove( connections );
		connections.map( this.props.deleteSiteConnection );
		this.props.connections.destroy( connections );
	},

	toggleSitewideConnection: function( connection, isSitewide ) {
		this.props.connections.update( connection, { shared: isSitewide } );
	},

	/**
	 * Given a service name and optional site ID, returns the current status of the
	 * service's connection.
	 *
	 * @param {string} service The name of the service to check
	 * @return {string} Connection status.
	 */
	getConnectionStatus: function( service ) {
		let status;

		if ( this.props.isFetching ) {
			// When connections are still loading, we don't know the status
			status = 'unknown';
		} else if ( ! some( this.props.siteConnections, { service } ) ) {
			// If no connections exist, the service isn't connected
			status = 'not-connected';
		} else if ( some( this.props.siteConnections, { status: 'broken', keyring_connection_user_ID: this.props.user.ID } ) ) {
			// A problematic connection exists
			status = 'reconnect';
		} else {
			// If all else passes, assume service is connected
			status = 'connected';
		}

		return status;
	},

	render: function() {
		const connectionStatus = this.getConnectionStatus( this.props.service.ID ),
			connections = serviceConnections.getConnections( this.props.service.ID ),
			elementClass = [
				'sharing-service',
				this.props.service.ID,
				connectionStatus,
				this.state.isOpen ? 'is-open' : ''
			].join( ' ' ),
			iconsMap = {
				Facebook: 'facebook',
				Twitter: 'twitter',
				'Google+': 'google-plus',
				LinkedIn: 'linkedin',
				Tumblr: 'tumblr',
				Path: 'path',
				Eventbrite: 'eventbrite'
			};
		let accounts;

		if ( this.state.isSelectingAccount ) {
			accounts = serviceConnections.getAvailableExternalAccounts( this.props.service.ID, this.props.site.ID );
		}

		const header = (
			<div>
				<SocialLogo
					icon={ iconsMap[ this.props.service.label ] }
					size={ 48 }
					className="sharing-service__logo" />

				<div className="sharing-service__name">
					<h2>{ this.props.service.label }</h2>
					<ServiceDescription
						service={ this.props.service }
						status={ connectionStatus }
						numberOfConnections={ connections.length } />
				</div>
			</div>
		);

		const content = (
			<div
				className={ 'sharing-service__content ' + ( serviceConnections.isFetchingAccounts() ? 'is-placeholder' : '' ) }>
				<ServiceExamples service={ this.props.service } site={ sites.getSelectedSite() } />
				<ServiceConnectedAccounts
					site={ this.props.site }
					user={ this.props.user }
					service={ this.props.service }
					connections={ connections }
					onAddConnection={ this.connect }
					onRemoveConnection={ this.disconnect }
					isDisconnecting={ this.state.isDisconnecting }
					onRefreshConnection={ this.refresh }
					isRefreshing={ this.state.isRefreshing }
					onToggleSitewideConnection={ this.props.onToggleSitewideConnection } />
				<ServiceTip service={ this.props.service } />
			</div> );

		const action = (
			<ServiceAction
				status={ connectionStatus }
				service={ this.props.service }
				onAction={ this.performAction }
				isConnecting={ this.state.isConnecting }
				isRefreshing={ this.state.isRefreshing }
				isDisconnecting={ this.state.isDisconnecting } />
		);
		return (
			<div>
				<AccountDialog
					isVisible={ this.state.isSelectingAccount }
					service={ this.props.service }
					accounts={ accounts }
					onAccountSelected={ this.addConnection } />
				<FoldableCard
					className={ elementClass }
					header={ header }
					clickableHeader
					compact
					summary={ action }
					expandedSummary={ action } >
					{ content }

				</FoldableCard>
			</div>
		);
	}
} );

export default connect(
	( state ) => ( {
		isFetching: isFetchingConnections( state, getSelectedSiteId( state ) ),
		siteConnections: getConnectionsBySiteId( state, getSelectedSiteId( state ) ),
	} ),
	{
		createSiteConnection,
		deleteSiteConnection,
		fetchConnections,
		updateSiteConnection,
		warningNotice,
	},
)( SharingService );
