/**
 * External dependencies
 */
import { expect } from 'chai';
import { useSandbox } from 'test/helpers/use-sinon';
import useNock from 'test/helpers/use-nock';

/**
 * Internal dependencies
 */
import {
	timezonesRequestAction,
	timezonesRequestSucessAction,
	timezonesRequestReceiveAction,
} from '../actions';

/*
 * Fixtures
 */
import {
	TIMEZONES_DATA,
	WP_REST_API,
} from './fixture';

/*
 * Util functions
 */
import { requestTimezones } from '../utils';

describe( 'actions', () => {
	let spy;
	useSandbox( ( sandbox ) => spy = sandbox.spy() );

	describe( '#requestTimezones() - success', () => {
		describe( 'success', () => {
			useNock( ( nock ) => {
				nock( WP_REST_API.hostname )
					.persist()
					.get( WP_REST_API.namespace + WP_REST_API.endpoint )
					.reply( 200, TIMEZONES_DATA );
			} );

			it( 'should dispatch REQUEST action when thunk triggered', () => {
				const action = timezonesRequestAction();
				requestTimezones()( spy );
				expect( spy ).to.have.been.calledWith( action );
			} );

			it( 'should dispatch REQUEST_SUCCESS action when thunk triggered', () => {
				const action = timezonesRequestSucessAction();
				return requestTimezones()( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( action );
				} );
			} );

			it( 'should dispatch RECEIVE action when request completes', () => {
				const action = timezonesRequestReceiveAction( TIMEZONES_DATA );

				return requestTimezones()( spy ).then( () => {
					expect( spy ).to.have.been.calledWith( action );
				} );
			} );
		} );
	} );
} );
