import {CONST_EXPR} from 'angular2/src/core/facade/lang';
import {EventEmitter, ObservableWrapper} from 'angular2/src/core/facade/async';
import {OnChanges} from 'angular2/lifecycle_hooks';
import {SimpleChange} from 'angular2/src/core/change_detection';
import {Query, Directive} from 'angular2/src/core/metadata';
import {forwardRef, Binding, Inject, Optional} from 'angular2/src/core/di';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from './control_value_accessor';
import {NgControl} from './ng_control';
import {Control} from '../model';
import {Validators, NG_VALIDATORS} from '../validators';
import {setUpControl, isPropertyUpdated, selectValueAccessor} from './shared';

const formControlBinding = CONST_EXPR(new Binding(NgControl, {toAlias: forwardRef(() => NgModel)}));

/**
 * Binds a domain model to a form control.
 *
 * # Usage
 *
 * `ng-model` binds an existing domain model to a form control. For a
 * two-way binding, use `[(ng-model)]` to ensure the model updates in
 * both directions.
 *
 * ### Example ([live demo](http://plnkr.co/edit/R3UX5qDaUqFO2VYR0UzH?p=preview))
 *  ```typescript
 * @Component({selector: "search-comp"})
 * @View({
 *      directives: [FORM_DIRECTIVES],
 *      template: `<input type='text' [(ng-model)]="searchQuery">`
 *      })
 * class SearchComp {
 *  searchQuery: string;
 * }
 *  ```
 */
@Directive({
  selector: '[ng-model]:not([ng-control]):not([ng-form-control])',
  bindings: [formControlBinding],
  inputs: ['model: ngModel'],
  outputs: ['update: ngModel'],
  exportAs: 'form'
})
export class NgModel extends NgControl implements OnChanges {
  /** @internal */
  _control = new Control();
  /** @internal */
  _added = false;
  update = new EventEmitter();
  model: any;
  viewModel: any;
  validators: Function[];

  constructor(@Optional() @Inject(NG_VALIDATORS) validators: Function[],
              @Optional() @Inject(NG_VALUE_ACCESSOR) valueAccessors: ControlValueAccessor[]) {
    super();
    this.validators = validators;
    this.valueAccessor = selectValueAccessor(this, valueAccessors);
  }

  onChanges(changes: {[key: string]: SimpleChange}) {
    if (!this._added) {
      setUpControl(this._control, this);
      this._control.updateValidity();
      this._added = true;
    }

    if (isPropertyUpdated(changes, this.viewModel)) {
      this._control.updateValue(this.model);
      this.viewModel = this.model;
    }
  }

  get control(): Control { return this._control; }

  get path(): string[] { return []; }

  get validator(): Function { return Validators.compose(this.validators); }

  viewToModelUpdate(newValue: any): void {
    this.viewModel = newValue;
    ObservableWrapper.callNext(this.update, newValue);
  }
}
