/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import page from 'page';

/**
 * Internal dependencies
 */
import DnsAddNew from './dns-add-new';
import DnsDetails from './dns-details';
import DnsList from './dns-list';
import DomainMainPlaceholder from 'my-sites/upgrades/domain-management/components/domain/main-placeholder';
import Header from 'my-sites/upgrades/domain-management/components/header';
import Main from 'components/main';
import paths from 'my-sites/upgrades/paths';
import { getSelectedDomain, isRegisteredDomain } from 'lib/domains';
import Card from 'components/card/compact';
import SectionHeader from 'components/section-header';

export const Dns = React.createClass( {
	propTypes: {
		dns: PropTypes.object.isRequired,
		selectedDomainName: PropTypes.string.isRequired,
		selectedSite: PropTypes.oneOfType( [
			PropTypes.object,
			PropTypes.bool
		] ).isRequired,
		translate: PropTypes.func,
	},

	goBack() {
		const {
			selectedDomain,
			selectedDomainName,
			selectedSite: { slug },
		} = this.props;

		const path = isRegisteredDomain( selectedDomain )
			? paths.domainManagementNameServers
			: paths.domainManagementEdit;

		page( path( slug, selectedDomainName ) );
	},

	render() {
		const {
			dns,
			selectedDomainName,
			selectedSite,
		} = this.props;

		if ( ! dns.hasLoadedFromServer ) {
			return <DomainMainPlaceholder goBack={ this.goBack } />;
		}

		return (
			<Main className="dns">
				<Header
					onClick={ this.goBack }
					selectedDomainName={ selectedDomainName }
				>
					{ this.translate( 'DNS Records' ) }
				</Header>

				<SectionHeader label={ this.translate( 'DNS Records' ) } />
				<Card>
					<DnsDetails />

					<DnsList
						dns={ dns }
						selectedSite={ selectedSite }
						selectedDomainName={ selectedDomainName } />

					<DnsAddNew
						isSubmittingForm={ dns.isSubmittingForm }
						selectedDomainName={ selectedDomainName } />
				</Card>
			</Main>
		);
	}
} );

export default Dns;
