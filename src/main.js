import { delay } from 'bluebird';
import { createElement } from 'react';
import { hydrate, render } from 'react-dom';
import { DataSource } from 'relaks-wordpress-data-source';
import { RouteManager } from 'relaks-route-manager';
import { harvest } from 'relaks-harvest';
import { plant } from 'relaks';
import { FrontEnd } from './front-end.jsx';
import { Route, routes } from './routing.js';

window.addEventListener('load', initialize);

async function initialize(evt) {
  // create data source
  const host = process.env.DATA_HOST || `${location.protocol}//${location.host}`;
  const basePath = process.env.BASE_PATH;
  const dataSource = new DataSource({
    baseURL: host + basePath + 'json',
  });
  dataSource.activate();

  // create route manager
  const routeManager = new RouteManager({
    routes,
    basePath,
    useHashFallback: (location.protocol !== 'http:' && location.protocol !== 'https:'),
  });
  routeManager.addEventListener('beforechange', (evt) => {
    const route = new Route(routeManager, dataSource);
    evt.postponeDefault(route.setParameters(evt, true));
  });
  routeManager.activate();
  await routeManager.start();

  const container = document.getElementById('react-container');
  if (!process.env.DATA_HOST) {
    // there is SSR support when we're fetching data from the same host
    // as the HTML page
    const ssrElement = createElement(FrontEnd, { dataSource, routeManager, ssr: 'hydrate' });
    const seeds = await harvest(ssrElement, { seeds: true });
    plant(seeds);
    hydrate(ssrElement, container);
  }
  const csrElement = createElement(FrontEnd, { dataSource, routeManager });
  render(csrElement, container);

  // check for changes periodically
  const mtimeURL = host + basePath + '.mtime';
  let mtimeLast;
  for (;;) {
    try {
      const res = await fetch(mtimeURL);
      const mtime = await res.text();
      if (mtime !== mtimeLast) {
        if (mtimeLast) {
          dataSource.invalidate();
        }
        mtimeLast = mtime;
      }
    } catch (err) {
    }
    await delay(30 * 1000);
  }
}
