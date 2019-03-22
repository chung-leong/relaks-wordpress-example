import _ from 'lodash';
import React, { PureComponent } from 'react';
import { Route } from 'routing';

import HTML from 'widgets/html';

class PageListView extends PureComponent {
    static displayName = 'PageListView';

    render() {
        let { route, page } = this.props;
        let title = _.get(page, 'title.rendered') || 'Untitled';
        let url = route.prefetchObjectURL(page);
        return (
            <div className="page-list-view">
                <a href={url}><HTML text={title} /></a>
            </div>
        );
    }
}

if (process.env.NODE_ENV !== 'production') {
    const PropTypes = require('prop-types');

    PageListView.propTypes = {
        page: PropTypes.object,
        route: PropTypes.instanceOf(Route).isRequired,
    };
}

export {
    PageListView as default,
    PageListView,
};
