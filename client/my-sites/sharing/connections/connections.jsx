/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import observe from 'lib/mixins/data-observe';
import SharingServicesGroup from './services-group';

const SharingConnections = React.createClass( {
	displayName: 'SharingConnections',

	mixins: [ observe( 'sites', 'connections', 'user' ) ],

	render: function() {
		const commonGroupProps = {
			user: this.props.user,
			connections: this.props.connections,
			initialized: !! this.props.sites.selected
		};

		if ( this.props.sites.selected ) {
			commonGroupProps.site = this.props.sites.getSelectedSite();
		}

		return (
			<div id="sharing-connections" className="sharing-settings sharing-connections">
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
	}
} );

export default SharingConnections;
