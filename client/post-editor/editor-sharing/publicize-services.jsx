/**
 * External dependencies
 */
var React = require( 'react' );
import { connect } from 'react-redux';
import { uniq } from 'lodash';

/**
 * Internal dependencies
 */
var EditorSharingPublicizeConnection = require( './publicize-connection' );
import { getCurrentUserId } from 'state/current-user/selectors';

const EditorSharingPublicizeServices = React.createClass( {
	displayName: 'EditorSharingPublicizeServices',

	propTypes: {
		post: React.PropTypes.object,
		siteId: React.PropTypes.number.isRequired,
		connections: React.PropTypes.array.isRequired,
		newConnectionPopup: React.PropTypes.func.isRequired
	},

	renderServices: function() {
		const services = uniq( this.props.connections.map( ( connection ) => ( {
			ID: connection.service,
			label: connection.label,
		} ) ), 'ID' );

		return services.map( function( service ) {
			return (
				<li key={ service.ID } className="editor-sharing__publicize-service">
					<h5 className="editor-sharing__publicize-service-heading">{ service.label }</h5>
					{ this.renderConnections( service.ID ) }
				</li>
			);
		}, this );
	},

	renderConnections: function( serviceName ) {
		// Only include connections of the specified service, filtered by
		// those owned by the current user or shared.
		const connections = this.props.connections.filter( ( connection ) =>
			connection.service === serviceName && ( connection.keyring_connection_user_ID === this.props.userId || connection.shared )
		);

		return connections.map( function( connection ) {
			return (
				<EditorSharingPublicizeConnection
					key={ connection.ID }
					post={ this.props.post }
					connection={ connection }
					onRefresh={ this.props.newConnectionPopup } />
			);
		}, this );
	},

	render: function() {
		return (
			<ul className="editor-sharing__publicize-services">
				{ this.renderServices() }
			</ul>
		);
	}
} );

export default connect(
	( state ) => ( {
		userId: getCurrentUserId( state ),
	} ),
)( EditorSharingPublicizeServices );
