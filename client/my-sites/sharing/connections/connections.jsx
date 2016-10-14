/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import {
	createSiteConnection,
	fetchConnections,
	updateSiteConnection,
} from 'state/sharing/publicize/actions';
import {
	successNotice,
	warningNotice,
} from 'state/notices/actions';
import observe from 'lib/mixins/data-observe';
import analytics from 'lib/analytics';
import SharingServicesGroup from './services-group';
import AccountDialog from './account-dialog';
import serviceConnections from './service-connections';
import PopupMonitor from 'lib/popup-monitor';

const SharingConnections = React.createClass( {
	displayName: 'SharingConnections',

	mixins: [ observe( 'sites', 'connections', 'user' ) ],

	getInitialState: function() {
		return { selectingAccountForService: null };
	},

	getConnections: function() {
		if ( this.props.sites.selected ) {
			return this.props.connections.get( this.props.sites.getSelectedSite().ID );
		}

		return this.props.connections.get();
	},

	addConnection: function( service, keyringConnectionId, externalUserId = false ) {
		const _this = this;
		let siteId;
		if ( this.props.sites.selected ) {
			siteId = this.props.sites.getSelectedSite().ID;
		}

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

				analytics.ga.recordEvent( 'Sharing', 'Clicked Connect Button in Modal', this.state.selectingAccountForService.ID );
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
						_this.setState( { selectingAccountForService: service } );
					}
				} );
			}
		} else {
			// If an account wasn't selected from the dialog or the user cancels
			// the connection, the dialog should simply close
			this.props.warningNotice( this.translate( 'The connection could not be made because no account was selected.', {
				context: 'Sharing: Publicize connection confirmation'
			} ) );
			analytics.ga.recordEvent( 'Sharing', 'Clicked Cancel Button in Modal', this.state.selectingAccountForService.ID );
		}

		// Reset active account selection
		this.setState( { selectingAccountForService: null } );
	},

	refreshConnection: function( connection ) {
		this.props.connections.refresh( connection );
	},

	removeConnection: function( connections ) {
		connections = serviceConnections.filterConnectionsToRemove( connections );
		this.props.connections.destroy( connections );
	},

	toggleSitewideConnection: function( connection, isSitewide ) {
		this.props.connections.update( connection, { shared: isSitewide } );
	},

	getAccountDialog: function() {
		const isSelectingAccount = !! this.state.selectingAccountForService;
		let accounts, siteId;

		if ( isSelectingAccount ) {
			if ( this.props.sites.selected ) {
				siteId = this.props.sites.getSelectedSite().ID;
			}

			accounts = serviceConnections.getAvailableExternalAccounts( this.state.selectingAccountForService.ID, siteId );
		}

		return (
			<AccountDialog
				isVisible={ isSelectingAccount }
				service={ this.state.selectingAccountForService }
				accounts={ accounts }
				onAccountSelected={ this.addConnection } />
		);
	},

	renderServiceGroups: function() {
		const commonGroupProps = {
			user: this.props.user,
			connections: this.props.connections,
			onAddConnection: this.addConnection,
			onRemoveConnection: this.removeConnection,
			onRefreshConnection: this.refreshConnection,
			onToggleSitewideConnection: this.toggleSitewideConnection,
			initialized: !! this.props.sites.selected
		};

		if ( this.props.sites.selected ) {
			commonGroupProps.site = this.props.sites.getSelectedSite();
		}

		return (
			<div>
				<SharingServicesGroup
					type="publicize"
					title={ this.translate( 'Publicize Your Posts' ) }
					{ ...commonGroupProps } />
				<SharingServicesGroup
					type="other"
					title={ this.translate( 'Other Connections' ) }
					description={ this.translate( 'Connect any of these additional services to further enhance your site.' ) }
					{ ...commonGroupProps } />
			</div>
		);
	},

	render: function() {
		return (
			<div id="sharing-connections" className="sharing-settings sharing-connections">
				{ this.getAccountDialog() }
				{ this.renderServiceGroups() }
			</div>
		);
	}
} );

export default connect(
	null,
	{
		createSiteConnection,
		fetchConnections,
		successNotice,
		updateSiteConnection,
		warningNotice,
	},
)( SharingConnections );
