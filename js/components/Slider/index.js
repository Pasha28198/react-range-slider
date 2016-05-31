/* @flow */

import React, { Component, PropTypes } from 'react';
import Track from '../Track';
import Handle from '../Handle';
import Gradient from '../Gradient';
import styles from './styles.css';
import {
  has,
  stepValidator,
  getValueOrAlt,
} from '../../utils/common';
import {
  valueValidator,
  defaultValueValidator,
} from '../../utils/slider';

export default class Slider extends Component {

  static propTypes = {
    id: PropTypes.string,
    name: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: stepValidator,
    value: valueValidator,
    defaultValue: defaultValueValidator,
    tabIndex: PropTypes.number,
    onChange: PropTypes.func,
    afterChange: PropTypes.func,
    disabled: PropTypes.bool,
    readOnly: PropTypes.bool,
    'aria-labelledby': PropTypes.string,
    wrapperClassName: PropTypes.string,
    trackClassName: PropTypes.string,
    highlightedTrackClassName: PropTypes.string,
    handleClassName: PropTypes.string,
  };

  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
    readOnly: false,
  };

  constructor(props: Object): void {
    super(props);
    let value;
    if (has(props, 'value')) {
      value = this.props.value;
    } else if (props.defaultValue) {
      value = props.defaultValue;
    }
    this.state = {
      value,
    };
  }

  state: Object;

  componentWillReceiveProps(properties: Object): void {
    if (has(properties, 'value')) {
      this.setState({
        value: properties.value,
      });
    }
  }

  factor: number;
  trackLeft: number;
  value: number;

  _setFactor: Function = (track: Object): void => {
    const trackWidth = track.clientWidth;
    this.setState({
      trackWidth,
    });
    this.trackLeft = track.getBoundingClientRect().left;
  };

  _setHandleWidth: Function = ({ clientWidth }): void => {
    if (!this.state.handleWidth) {
      this.setState({
        handleWidth: clientWidth,
      });
    }
  };

  _handleMove: Function = (increase: number): void => {
    const { disabled, readOnly, step, min } = this.props;
    const { value } = this.state;
    if (!disabled && !readOnly) {
      const newValue = this._getValue(getValueOrAlt(value, min) + increase * step);
      if (newValue !== value) {
        this._updateState(newValue);
        this._onChange(newValue);
      }
    }
  };

  _onWrapperMouseDown: Function = (event: Object): void => {
    const { disabled, readOnly } = this.props;
    if (!disabled && !readOnly) {
      this._moveHandleToPosition(event.pageX);
    }
  };

  _onWrapperTouchStart: Function = (event: Object): void => {
    const { disabled, readOnly } = this.props;
    if (!disabled && !readOnly) {
      if (event.touches.length === 1) {
        event.preventDefault();
        this._moveHandleToPosition(event.touches[0].pageX);
      }
    }
  };

  _moveHandleToPosition: Function = (position: number): void => {
    const { disabled, readOnly } = this.props;
    if (!disabled && !readOnly) {
      const { value } = this.state;
      const { min } = this.props;
      const mouseDownPosition = position - this.trackLeft + (min * this.factor);
      let newValue = this._getStepValue(
        (mouseDownPosition - this.state.handleWidth / 2) / this.factor);
      newValue = this._getValue(newValue);
      if (newValue !== getValueOrAlt(value, min)) {
        this._updateState(newValue);
        this._onChange(newValue);
        this._afterChange(newValue);
      }
    }
  };

  _getStepValue: Function = (position: number) => {
    const { step } = this.props;
    const remainder = position % step;
    if (remainder < step / 2) {
      return position - remainder;
    }
    return position - remainder + step;
  };

  _getValue(value: number): number {
    let newValue = value;
    if (newValue < this.props.min) {
      newValue = this.props.min;
    } else if (newValue > this.props.max) {
      newValue = this.props.max;
    }
    return newValue;
  }

  _updateState: Function = (value: number): void => {
    if (!has(this.props, 'value')) {
      this.setState({
        value,
      });
    }
  };

  _onChange: Function = (value: number): void => {
    if (this.props.onChange) {
      this.props.onChange({
        value,
      });
    }
  };

  _afterChange: Function = (value: number): void => {
    if (this.props.afterChange) {
      this.props.afterChange({
        value: getValueOrAlt(value, this.state.value),
      });
    }
  };

  render(): Object {
    let position = 0;
    let percentageFactor = 1;
    this.factor = 1;
    const {
      handleWidth,
      trackWidth,
      value,
    } = this.state;
    const {
      min,
      max,
    } = this.props;
    this.value = getValueOrAlt(value, min);
    if (trackWidth && handleWidth) {
      const calculatedTrackWidth = trackWidth - handleWidth;
      this.factor = calculatedTrackWidth / (max - min);
      if (this.value < min) {
        position = min;
      } else if (this.value > max) {
        position = max;
      } else {
        position = this.value;
      }
      position = (position - min) * getValueOrAlt(this.factor, 1);
      percentageFactor = 100 / trackWidth;
    }
    return (
      <div
        id={this.props.id}
        name={this.props.name}
        className={`${styles.wrapper} ${this.props.wrapperClassName}`}
        onClick={this._onWrapperMouseDown}
        onTouchStart={this._onWrapperTouchStart}
        role="slider"
        aria-labelledby={this.props['aria-labelledby']}
        aria-valuemin={this.props.min}
        aria-valuemax={this.props.max}
        aria-valuetext={value}
        aria-orientation="horizontal"
        aria-disabled={this.props.disabled}
        aria-readonly={this.props.readonly}
      >
        <Track
          trackRef={this._setFactor}
          className={this.props.trackClassName}
        />
        <Handle
          left={`${position * percentageFactor}%`}
          tabIndex={this.props.disabled ? undefined : this.props.tabIndex || 0}
          handleRef={this._setHandleWidth}
          handleMove={this._handleMove}
          afterChange={this._afterChange}
          factor={this.factor}
          step={this.props.step}
          className={this.props.handleClassName}
        />
        {this.props.disabled ? <Gradient /> : undefined}
      </div>
    );
  }
}