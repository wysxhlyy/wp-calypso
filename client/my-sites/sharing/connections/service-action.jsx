/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import Button from 'components/button';

module.exports = React.createClass( {
	displayName: 'SharingServiceAction',

	propTypes: {
		status: React.PropTypes.string,
		service: React.PropTypes.object.isRequired,
		onAction: React.PropTypes.func,
		connections: React.PropTypes.array,
		isDisconnecting: React.PropTypes.bool,
		isRefreshing: React.PropTypes.bool,
		isConnecting: React.PropTypes.bool,
		removableConnections: React.PropTypes.array,
	},

	getDefaultProps: function() {
		return {
			status: 'unknown',
			onAction: function() {},
			connections: Object.freeze( [] ),
			isDisconnecting: false,
			isRefreshing: false,
			isConnecting: false,
			removableConnections: Object.freeze( [] ),
		};
	},

	onActionClick: function( event ) {
		event.stopPropagation();
		this.props.onAction();
	},

	render: function() {
		let primary = false,
			borderless = false,
			warning = false,
			isPending, label;

		isPending = 'unknown' === this.props.status || this.props.isDisconnecting ||
			this.props.isRefreshing || this.props.isConnecting;

		if ( 'unknown' === this.props.status ) {
			label = this.translate( 'Loading…', { context: 'Sharing: Publicize status pending button label' } );
		} else if ( this.props.isDisconnecting ) {
			label = this.translate( 'Disconnecting…', { context: 'Sharing: Publicize disconnect pending button label' } );
		} else if ( this.props.isRefreshing ) {
			label = this.translate( 'Reconnecting…', { context: 'Sharing: Publicize reconnect pending button label' } );
			warning = true;
		} else if ( this.props.isConnecting ) {
			label = this.translate( 'Connecting…', { context: 'Sharing: Publicize connect pending button label' } );
		} else if ( 'connected' === this.props.status && this.props.removableConnections.length ) {
			if ( this.props.removableConnections.length > 1 ) {
				label = this.translate( 'Disconnect All', { context: 'Sharing: Publicize disconnect button label' } );
			} else {
				label = this.translate( 'Disconnect', { context: 'Sharing: Publicize disconnect button label' } );
			}
		} else if ( 'reconnect' === this.props.status ) {
			label = this.translate( 'Reconnect', { context: 'Sharing: Publicize reconnect pending button label' } );
			warning = true;
		} else {
			label = this.translate( 'Connect', { context: 'Sharing: Publicize connect pending button label' } );
			primary = true;
		}

		return (
			<Button
				primary={ primary }
				borderless={ borderless }
				scary={ warning }
				compact
				onClick={ this.onActionClick }
				disabled={ isPending }>
				{ label }
			</Button>
		);
	}
} );
