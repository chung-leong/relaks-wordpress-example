import React, { useState, useEffect, useMemo } from 'react';
import { useEventTime } from 'relaks';
import { Wordpress } from './wordpress.js';
import { Route } from './routing.js';

import { SideNav } from './widgets/side-nav.jsx';
import { TopNav } from './widgets/top-nav.jsx';
import { ErrorBoundary } from './widgets/error-boundary.jsx';

import './style.scss';
import '@fortawesome/fontawesome-free/scss/fontawesome.scss';
import '@fortawesome/fontawesome-free/scss/regular.scss';
import '@fortawesome/fontawesome-free/scss/solid.scss';

export function FrontEnd(props) {
  const { routeManager, dataSource, ssr } = props;
  const [ routeChanged, setRouteChanged ] = useEventTime();
  const [ dataChanged, setDataChanged ] = useEventTime();
  const route = useMemo(() => {
    return new Route(routeManager, dataSource);
  }, [ routeManager, dataSource, routeChanged ]);
  const wp = useMemo(() => {
    return new Wordpress(dataSource, ssr);
  }, [ dataSource, ssr, dataChanged ]);
  const [ sideNavCollapsed, collapseSideNav ] = useState(true);
  const [ topNavCollapsed, collapseTopNav ] = useState(false);

  useEffect(() => {
    routeManager.addEventListener('change', setRouteChanged);
    dataSource.addEventListener('change', setDataChanged);
    return () => {
      routeManager.addEventListener('change', setRouteChanged);
      dataSource.addEventListener('change', setDataChanged);
    };
  }, [ routeManager, dataSource ]);
  useEffect(() => {
    let previousPos = getScrollPos();
    const handleScroll = (evt) => {
      const currentPos = getScrollPos();
      const delta = currentPos - previousPos;
      if (delta > 0) {
        if (!topNavCollapsed) {
          // check to see if we have scroll down efficiently, so that
          // hidden the top nav won't reveal white space
          const pageContainer = document.getElementsByClassName('page-container')[0];
          const page = (pageContainer) ? pageContainer.firstChild : null;
          if (page) {
            const pageRect = page.getBoundingClientRect();
            if (pageRect.top <= 40) {
              collapseTopNav(true);
            }
          } else {
            collapseTopNav(true);
          }
        }
      } else if (delta < -10) {
        if (topNavCollapsed) {
          collapseTopNav(false);
        }
      }
      previousPos = currentPos;
    };
    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [ topNavCollapsed ]);
  useEffect(() => {
    if (typeof(window) === 'object') {
      const handleSwipeLeft = (evt) => {
        if (!sideNavCollapsed) {
          collapseSideNav(true);
        }
      };
      const handleSwipeRight = (evt) => {
        if (sideNavCollapsed) {
          collapseSideNav(false);
        }
      };

      const Hammer = require('hammerjs');
      const hammer = new Hammer(document.body, { cssProps: { userSelect: 'auto' } });
      hammer.on('swipeleft', handleSwipeLeft);
      hammer.on('swiperight', handleSwipeRight);
      return () => {
        hammer.off('swipeleft', handleSwipeLeft);
        hammer.off('swiperight', handleSwipeRight);
        hammer.stop();
      };
    }
  }, [ sideNavCollapsed ]);
  const historyDepthBefore = route.history.length;
  useEffect(() => {
    return () => {
      const historyDepthAfter = route.history.length;
      if (historyDepthBefore < historyDepthAfter) {
        // not going backward
        if (document.body.parentElement.scrollTop > 0) {
          document.body.parentElement.scrollTop = 0;
        } else if (document.body.scrollTop > 0) {
          document.body.scrollTop = 0;
        }
      }
    };
  }, [ route ]);

  const PageComponent = route.params.module.default;
  const classNames = [];
  if (topNavCollapsed) {
    classNames.push('top-collapsed');
  }
  if (sideNavCollapsed) {
    classNames.push('side-collapsed');
  }
  const key = route.url;
  return (
    <div className={classNames.join(' ')}>
      <ErrorBoundary>
        <SideNav route={route} wp={wp} />
        <TopNav route={route} wp={wp} />
        <div className="page-container">
          <PageComponent route={route} wp={wp} key={key} />
        </div>
      </ErrorBoundary>
      <div id="overlay" />
    </div>
  );

  function getScrollPos() {
    let pos = document.body.scrollTop;
    if (pos === 0 && document.body.parentNode.scrollTop > 0) {
      pos = document.body.parentNode.scrollTop;
    }
    return pos;
  }

  function resetScrollPos() {
    if (document.body.parentElement.scrollTop > 0) {
      document.body.parentElement.scrollTop = 0;
    } else if (document.body.scrollTop > 0) {
      document.body.scrollTop = 0;
    }
  }
}

if (process.env.NODE_ENV !== 'production') {
  require('./props');
}
