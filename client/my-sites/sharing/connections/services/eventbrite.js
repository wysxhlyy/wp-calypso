/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * Internal dependencies
 */
import sites from 'lib/sites-list';

export function getConnections( connections, serviceName, siteId ) {
	const site = siteId ? sites().getSite( siteId ) : sites().getSelectedSite();

	if ( ! site || ! site.settings ) {
		return [];
	}

	return connections.filter( ( connection ) => site.settings.eventbrite_api_token === connection.keyring_connection_ID );
}

export function didKeyringConnectionSucceed( value, serviceName, siteId, availableExternalConnections ) {
	const site = siteId ? sites().getSite( siteId ) : sites().getSelectedSite(),
		connection = last( availableExternalConnections );

	if ( site && connection ) {
		// Update site setting with Eventbrite token details
		site.saveSettings( { eventbrite_api_token: connection.keyringConnectionId } );
	}

	return value;
}

export function filterConnectionToRemove( shouldDestroy, connection, siteId ) {
	const site = siteId ? sites().getSite( siteId ) : sites().getSelectedSite();

	if ( site ) {
		// Update site setting to remove Eventbrite token details
		site.saveSettings( { eventbrite_api_token: '' } );
	}

	return false;
}
