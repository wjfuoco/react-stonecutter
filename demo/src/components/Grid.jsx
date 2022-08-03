import React, { Component } from 'react';
import isEqualWith from 'lodash.isequalwith';
import {
  CSSGrid,
  makeResponsive,
  measureItems,
  layout as layouts,
  enterExitStyle as enterExitStyles
} from '../../../src/index';

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = this.createGrid(props);
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !isEqualWith(nextProps, this.props, (a, b, key) => {
        if (key === 'children') return true;
      })
    ) {
      this.setState(this.createGrid(nextProps));
    }
  }

  createGrid = ({ measured, responsive }) => {
    let Grid = CSSGrid;

    if (measured) {
      Grid = measureItems(Grid);
    }

    if (responsive) {
      Grid = makeResponsive(Grid, {
        maxWidth: 1920,
        minPadding: 100
      });
    }

    return { Grid };
  };

  render() {
    const {
      children,
      useCSS,
      responsive,
      layout,
      enterExitStyle,
      duration,
      easing,
      gutters,
      columns,
      ...rest
    } = this.props;

    const { Grid } = this.state;

    const gridLayout = layouts[layout];
    const gridEnterExitStyle = enterExitStyles[enterExitStyle];

    return (
      <Grid
        {...rest}
        className="grid"
        component="ul"
        columns={!responsive ? columns : null}
        columnWidth={150}
        gutterWidth={gutters}
        gutterHeight={gutters}
        layout={gridLayout}
        enter={gridEnterExitStyle.enter}
        entered={gridEnterExitStyle.entered}
        exit={gridEnterExitStyle.exit}
        perspective={600}
        duration={useCSS ? duration : null}
        easing={useCSS ? easing : null}
      >
        {children}
      </Grid>
    );
  }
}
