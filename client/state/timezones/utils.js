/**
 * Internal dependencies
 */
import wpcom from 'lib/wp';

import {
	timezonesRequestAction,
	timezonesRequestSucessAction,
	timezonesRequestFailureAction,
	timezonesRequestReceiveAction,
} from './actions';

const undocumented = wpcom.undocumented();

/*
 * Start a request to WordPress.com server get the timezones
 */
export const requestTimezones = () => {
	return ( dispatch ) => {
		dispatch( timezonesRequestAction() );

		return undocumented.timezones()
			.then( ( zones ) => {
				dispatch( timezonesRequestSucessAction() );
				dispatch( timezonesRequestReceiveAction( zones ) );
			} ).catch( error => {
				dispatch( timezonesRequestFailureAction( error ) );
			} );
	};
};
