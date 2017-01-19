/**
 * External dependencies
 */
import { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * Internal dependencies
 */
import { requestTeams } from 'state/reader/teams/actions';

class QueryReaderTeams extends Component {
	componentWillMount() {
		if ( this.props.isRequesting ) {
			return;
		}

		this.props.requestTeams();
	}

	render() {
		return null;
	}
}

QueryReaderTeams.propTypes = {
	isRequesting: PropTypes.bool,
	request: PropTypes.func
};

export default connect(
	null,
	dispatch => {
		return bindActionCreators( { requestTeams, }, dispatch );
	}
)( QueryReaderTeams );
