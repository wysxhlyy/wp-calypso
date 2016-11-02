/**
 * External dependencies
 */
var React = require( 'react' ),
	PureRenderMixin = require( 'react-pure-render/mixin' );

/**
 * Internal dependencies
 */
var Spinner = require( 'components/spinner' );

module.exports = React.createClass( {
	displayName: 'Spinner',

	mixins: [ PureRenderMixin ],

	render: function() {
		return (
			<div>
				<p>
					<strong>Please exercise caution in deciding to use a spinner in your component.</strong>&nbsp;
					A lone spinner is a poor user-experience and conveys little context to what the user should expect from the page.&nbsp;
					Refer to <a href="/devdocs/docs/reactivity.md">the <em>Reactivity and Loading States</em> guide</a>&nbsp;
					for more information on building fast interfaces and making the most of data already available to use.
				</p>

				<strong>Spinner</strong>
				<Spinner />

				<br />
				<strong>counterClockwise: true</strong>
				<Spinner counterClockwise={ true } />

				<br />
				<strong>delay: 5000</strong>
				<Spinner delay={ 5000 } />
			</div>
		);
	}
} );
