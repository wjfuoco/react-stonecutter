// import React so you can use JSX (React.createElement) in your test
import React from 'react'

/**
 * render: lets us render the component as React would
 * screen: a utility for finding elements the same way the user does
 */
import {render, screen} from '@testing-library/react'
import CSSGrid from '../src/components/CSSGrid';

describe('Grid components common features', () => {
  const grids = [
    { name: 'CSSGrid', component: CSSGrid }
  ];

  grids.forEach(function({ name, component: Grid }) {
    describe(`<${name} />`, () => {
      it('Renders children', () => {
        render(<Grid columns={4} columnWidth={150} duration={2000}>
          <span className="item" />
          <span className="item" />
        </Grid>)

        expect(screen).to.have.exactly(2).descendants('.item');
      })

      it('Can change tag name', () => {
        render(<Grid component="ul" columns={4} columnWidth={150} duration={2000} />);

        expect(screen).to.have.tagName('ul');
      });
    });
  });
});
