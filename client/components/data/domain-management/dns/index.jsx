/**
 * External dependencies
 */
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import StoreConnection from 'components/data/store-connection';
import DnsStore from 'lib/domains/dns/store';
import DomainsStore from 'lib/domains/store';
import QuerySiteDomains from 'components/data/query-site-domains';
import upgradesActions from 'lib/upgrades/actions';
import { getDomainsBySite } from 'state/sites/domains/selectors';
import { getSelectedSite } from 'state/ui/selectors';

const stores = [
	DomainsStore,
	DnsStore
];

function getStateFromStores( props ) {
	return {
		domains: props.domains,
		dns: DnsStore.getByDomainName( props.selectedDomainName ),
		selectedDomainName: props.selectedDomainName,
		selectedSite: props.selectedSite,
	};
}

export class DnsData extends Component {
	static propTypes = {
		component: PropTypes.func.isRequired,
		selectedDomainName: PropTypes.string.isRequired,
		selectedSite: PropTypes.object,
	};

	constructor( props ) {
		super( props );

		this.loadDns();
	}

	componentWillUpdate() {
		this.loadDns();
	}

	loadDns = () => {
		upgradesActions.fetchDns( this.props.selectedDomainName );
	};

	render() {
		const { selectedSite } = this.props;

		return (
			<div>
				<QuerySiteDomains siteId={ get( selectedSite, 'ID' ) } />
				<StoreConnection
					component={ this.props.component }
					stores={ stores }
					getStateFromStores={ getStateFromStores }
					domains={ this.props.domains }
					selectedDomainName={ this.props.selectedDomainName }
					selectedSite={ this.props.selectedSite }
				/>
			</div>
		);
	}
}

const mapStateToProps = state => {
	const selectedSite = getSelectedSite( state );

	return {
		domains: getDomainsBySite( state, selectedSite ),
		selectedSite,
	};
};

export default connect( mapStateToProps )( DnsData );
