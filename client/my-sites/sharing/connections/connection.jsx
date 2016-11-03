/**
 * External dependencies
 */
var React = require( 'react' ),
	classNames = require( 'classnames' );
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
var analytics = require( 'lib/analytics' );
import { getUser } from 'state/users/selectors';

const SharingConnection = React.createClass( {
	displayName: 'SharingConnection',

	propTypes: {
		site: React.PropTypes.object,                    // The site for which the connection was created
		user: React.PropTypes.object,                    // A user object
		connection: React.PropTypes.object.isRequired,   // The single connection object
		service: React.PropTypes.object.isRequired,      // The service to which the connection is made
		onDisconnect: React.PropTypes.func,              // Handler to invoke when disconnecting
		isDisconnecting: React.PropTypes.bool,           // Is a service disconnection request pending?
		showDisconnect: React.PropTypes.bool,            // Display an inline disconnect button
		onRefresh: React.PropTypes.func,                 // Handler to invoke when refreshing
		isRefreshing: React.PropTypes.bool,              // Is a service refresh request pending?
		onToggleSitewideConnection: React.PropTypes.func // Handler to invoke when toggling sitewide connection
	},

	getInitialState: function() {
		return { isSavingSitewide: false };
	},

	componentDidUpdate: function( prevProps ) {
		if ( this.state.isSavingSitewide && this.props.connection.shared !== prevProps.connection.shared ) {
			this.setState( { isSavingSitewide: false } );
		}
	},

	getDefaultProps: function() {
		return {
			onDisconnect: function() {},
			isDisconnecting: false,
			showDisconnect: false,
			onRefresh: function() {},
			isRefreshing: false,
			onToggleSitewideConnection: function() {}
		};
	},

	disconnect: function() {
		if ( ! this.props.isDisconnecting ) {
			this.props.onDisconnect( this.props.connection );
		}
	},

	refresh: function() {
		if ( ! this.props.isRefreshing ) {
			this.props.onRefresh( this.props.connection );
		}
	},

	getProfileImage: function() {
		if ( this.props.connection.external_profile_picture ) {
			return <img src={ this.props.connection.external_profile_picture } alt={ this.props.connection.label } className="sharing-connection__account-avatar" />;
		} else {
			return (
				<span className={ 'sharing-connection__account-avatar is-fallback ' + this.props.connection.service }>
					<span className="screen-reader-text">{ this.props.connection.label }</span>
				</span>
			);
		}
	},

	getReconnectButton: function() {
		var currentUser = this.props.user;

		if ( currentUser && 'broken' === this.props.connection.status && currentUser.ID === this.props.connection.keyring_connection_user_ID ) {
			return (
				<a onClick={ this.refresh } className="sharing-connection__account-action reconnect">
					{ this.translate( 'Reconnect' ) }
				</a>
			);
		}
	},

	getDisconnectButton: function() {
		const userCanDelete = this.props.site.capabilities && this.props.site.capabilities.edit_others_posts ||
			this.props.connection.user_ID === this.props.user.ID;

		if ( this.props.showDisconnect && userCanDelete ) {
			return (
				<a onClick={ this.disconnect } className="sharing-connection__account-action disconnect">
					{ this.translate( 'Disconnect' ) }
				</a>
			);
		}
	},

	toggleSitewideConnection: function( event ) {
		if ( ! this.state.isSavingSitewide ) {
			var isNowSitewide = event.target.checked;
			this.setState( { isSavingSitewide: true } );
			this.props.onToggleSitewideConnection( this.props.connection, isNowSitewide );
			analytics.ga.recordEvent( 'Sharing', 'Clicked Connection Available to All Users Checkbox', this.props.service.ID, isNowSitewide ? 1 : 0 );
		}
	},

	isConnectionShared: function() {
		return this.state.isSavingSitewide ? ! this.props.connection.shared : this.props.connection.shared;
	},

	getConnectionKeyringUserLabel: function() {
		if ( this.props.user && this.props.connectionUser && this.props.user.ID !== this.props.connectionUser.ID ) {
			return (
				<aside className="sharing-connection__keyring-user">
					{ this.translate( 'Connected by %(username)s', {
						args: { username: this.props.connectionUser.nice_name },
						context: 'Sharing: connections'
					} ) }
				</aside>
			);
		}
	},

	getConnectionSitewideElement: function() {
		var userCanUpdate = this.props.site.capabilities && this.props.site.capabilities.edit_others_posts,
			content = [];

		if ( 'publicize' !== this.props.service.type ) {
			return;
		}

		if ( userCanUpdate ) {
			content.push( <input key="checkbox" type="checkbox" checked={ this.isConnectionShared() } onChange={ this.toggleSitewideConnection } readOnly={ this.state.isSavingSitewide } /> );
		}

		if ( userCanUpdate || this.props.connection.shared ) {
			content.push( <span key="label">{ this.translate( 'Connection available to all administrators, editors, and authors', { context: 'Sharing: Publicize' } ) }</span> );
		}

		if ( content.length ) {
			return <label className="sharing-connection__account-sitewide-connection">{ content }</label>;
		}
	},

	render: function() {
		var connectionSitewideElement = this.getConnectionSitewideElement(),
			connectionClasses, statusClasses;

		connectionClasses = classNames( 'sharing-connection', {
			disabled: this.props.isDisconnecting || this.props.isRefreshing
		} );

		statusClasses = classNames( 'sharing-connection__account-status', {
			'is-shareable': undefined !== connectionSitewideElement
		} );

		return (
			<li className={ connectionClasses }>
				{ this.getProfileImage() }
				<div className={ statusClasses }>
					<span className="sharing-connection__account-name">{ this.props.connection.external_display }</span>
					{ this.getConnectionKeyringUserLabel() }
					{ connectionSitewideElement }
				</div>
				<div className="sharing-connection__account-actions">
					{ this.getReconnectButton() }
					{ this.getDisconnectButton() }
				</div>
			</li>
		);
	}
} );

export default connect(
	( state, { connection } ) => ( {
		connectionUser: getUser( state, connection.keyring_connection_user_ID ),
	} ),
)( SharingConnection );
