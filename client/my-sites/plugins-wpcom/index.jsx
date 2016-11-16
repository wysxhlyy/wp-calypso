import React from 'react';

import PluginPanel from 'my-sites/plugins-wpcom/plugin-panel';

export const WpcomPluginsPanel = React.createClass( {
	render() {
		return <PluginPanel filter={ this.props.filter } search={ this.props.search } />;
	}
} );

export default WpcomPluginsPanel;
