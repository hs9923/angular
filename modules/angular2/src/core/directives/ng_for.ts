import {DoCheck} from 'angular2/lifecycle_hooks';
import {Directive} from 'angular2/src/core/metadata';
import {
  ChangeDetectorRef,
  IterableDiffer,
  IterableDiffers
} from 'angular2/src/core/change_detection';
import {ViewContainerRef, TemplateRef, ViewRef} from 'angular2/src/core/linker';
import {isPresent, isBlank} from 'angular2/src/core/facade/lang';

/**
 * The `NgFor` directive instantiates a template once per item from an iterable. The context for
 * each instantiated template inherits from the outer context with the given loop variable set
 * to the current item from the iterable.
 *
 * # Local Variables
 *
 * `NgFor` provides several exported values that can be aliased to local variables:
 *
 * * `index` will be set to the current loop iteration for each template context.
 * * `last` will be set to a boolean value indicating whether the item is the last one in the
 *   iteration.
 * * `even` will be set to a boolean value indicating whether this item has an even index.
 * * `odd` will be set to a boolean value indicating whether this item has an odd index.
 *
 * # Change Propagation
 *
 * There are two reasons why `NgFor` will need to update the DOM:
 * * The contents of the iterator changes.
 * * The iterator itself is replaced.
 *
 * When the contents of the iterator changes, `NgFor` makes the corresponding changes to the DOM:
 *
 * * When an item is added, a new instance of the template is added to the DOM.
 * * When an item is removed, its template instance is removed from the DOM.
 * * When items are reordered, their respective templates are reordered in the DOM.
 * * Otherwise, items remain unchanged in the DOM.
 *
 * If the iterator itself is replaced, the DOM will be thrown out and recreated from scratch
 * with elements from the new iterator.
 *
 * This has important implications for animations and any stateful controls in the template (such
 * as `<input>` elements which accept user input). If the iterator contents change, Angular will
 * reproduce those changes in the DOM. New rows can be animated in, removed rows can be animated
 * out, and unchanged rows retain any unsaved state such as user input.
 *
 * If the entire iterator is replaced, Angular will tear down the entire DOM and rebuild it with
 * from the new iterator, even if none of the elements have changed. This is an expensive
 * operation, and should be avoided if possible.
 *
 * # Syntax
 *
 * - `<li *ng-for="#item of items; #i = index">...</li>`
 * - `<li template="ng-for #item of items; #i = index">...</li>`
 * - `<template ng-for #item [ng-for-of]="items" #i="index"><li>...</li></template>`
 *
 * ### Example
 *
 * See a [live demo](http://plnkr.co/edit/KVuXxDp0qinGDyo307QW?p=preview) for a more detailed
 * example.
 *
 * ```
 * <ul>
 *   <li *ng-for="#error of errors; #i = index">
 *     Error {{i}} of {{errors.length}}: {{error.message}}
 *   </li>
 * </ul>
 * ```
 */
@Directive({selector: '[ng-for][ng-for-of]', inputs: ['ngForOf']})
export class NgFor implements DoCheck {
  _ngForOf: any;
  private _differ: IterableDiffer;

  constructor(private _viewContainer: ViewContainerRef, private _templateRef: TemplateRef,
              private _iterableDiffers: IterableDiffers, private _cdr: ChangeDetectorRef) {}

  set ngForOf(value: any) {
    this._ngForOf = value;
    if (isBlank(this._differ) && isPresent(value)) {
      this._differ = this._iterableDiffers.find(value).create(this._cdr);
    }
  }

  doCheck() {
    if (isPresent(this._differ)) {
      var changes = this._differ.diff(this._ngForOf);
      if (isPresent(changes)) this._applyChanges(changes);
    }
  }

  private _applyChanges(changes) {
    // TODO(rado): check if change detection can produce a change record that is
    // easier to consume than current.
    var recordViewTuples = [];
    changes.forEachRemovedItem((removedRecord) =>
                                   recordViewTuples.push(new RecordViewTuple(removedRecord, null)));

    changes.forEachMovedItem((movedRecord) =>
                                 recordViewTuples.push(new RecordViewTuple(movedRecord, null)));

    var insertTuples = this._bulkRemove(recordViewTuples);

    changes.forEachAddedItem((addedRecord) =>
                                 insertTuples.push(new RecordViewTuple(addedRecord, null)));

    this._bulkInsert(insertTuples);

    for (var i = 0; i < insertTuples.length; i++) {
      this._perViewChange(insertTuples[i].view, insertTuples[i].record);
    }

    for (var i = 0, ilen = this._viewContainer.length; i < ilen; i++) {
      this._viewContainer.get(i).setLocal('last', i === ilen - 1);
    }
  }

  private _perViewChange(view, record) {
    view.setLocal('\$implicit', record.item);
    view.setLocal('index', record.currentIndex);
    view.setLocal('even', (record.currentIndex % 2 == 0));
    view.setLocal('odd', (record.currentIndex % 2 == 1));
  }

  private _bulkRemove(tuples: RecordViewTuple[]): RecordViewTuple[] {
    tuples.sort((a, b) => a.record.previousIndex - b.record.previousIndex);
    var movedTuples = [];
    for (var i = tuples.length - 1; i >= 0; i--) {
      var tuple = tuples[i];
      // separate moved views from removed views.
      if (isPresent(tuple.record.currentIndex)) {
        tuple.view = this._viewContainer.detach(tuple.record.previousIndex);
        movedTuples.push(tuple);
      } else {
        this._viewContainer.remove(tuple.record.previousIndex);
      }
    }
    return movedTuples;
  }

  private _bulkInsert(tuples: RecordViewTuple[]): RecordViewTuple[] {
    tuples.sort((a, b) => a.record.currentIndex - b.record.currentIndex);
    for (var i = 0; i < tuples.length; i++) {
      var tuple = tuples[i];
      if (isPresent(tuple.view)) {
        this._viewContainer.insert(tuple.view, tuple.record.currentIndex);
      } else {
        tuple.view =
            this._viewContainer.createEmbeddedView(this._templateRef, tuple.record.currentIndex);
      }
    }
    return tuples;
  }
}

class RecordViewTuple {
  view: ViewRef;
  record: any;
  constructor(record, view) {
    this.record = record;
    this.view = view;
  }
}
