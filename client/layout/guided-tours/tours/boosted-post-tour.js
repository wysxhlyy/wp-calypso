/**
 * External dependencies
 */
import React from 'react';
import { translate } from 'i18n-calypso';
import { overEvery as and } from 'lodash';

/**
 * Internal dependencies
 */
import {
	ButtonRow,
	makeTour,
	Quit,
	Step,
	Tour,
} from 'layout/guided-tours/config-elements';
import {
	// hasUserRegisteredBefore,
	// isAbTestInVariant,
	isEnabled,
} from 'state/ui/guided-tours/contexts';
import { isDesktop } from 'lib/viewport';
import Button from 'components/button';

export const BoostedPostTour = makeTour(
	<Tour
		name="boostedPost"
		path="/post/"
		version="20170120"
		when={ and(
			isEnabled( 'boosted-post' ),
			isDesktop,
			// hasUserRegisteredBefore( new Date( '2016-12-15' ) ),
			// isAbTestInVariant( 'boostedPostTour', 'enabled' )
		) }
	>
		<Step name="init"
			target=".editor-ground-control__publish-combo"
			arrow="left-top"
			placement="beside"
		>
			<p>{ translate( 'Good looking post! Interested in giving it a boost?' ) }</p>
			<ButtonRow>
				<Button primary href="http://jonburke.polldaddy.com/s/boosted-post">
					{ translate( 'Learn more' ) }
				</Button>
				<Quit>{ translate( 'No, thanks.' ) }</Quit>
			</ButtonRow>
		</Step>
	</Tour>
);
