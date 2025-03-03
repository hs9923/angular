import {
  AsyncTestCompleter,
  TestComponentBuilder,
  beforeEach,
  beforeEachBindings,
  ddescribe,
  describe,
  el,
  expect,
  iit,
  inject,
  it,
  xit,
} from 'angular2/test_lib';

import {ListWrapper} from 'angular2/src/core/facade/collection';

import {Component, View, TemplateRef, ContentChild} from 'angular2/angular2';

import {NgFor} from 'angular2/src/core/directives/ng_for';


export function main() {
  describe('ng-for', () => {
    var TEMPLATE =
        '<div><copy-me template="ng-for #item of items">{{item.toString()}};</copy-me></div>';

    it('should reflect initial elements',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('1;2;');
               async.done();
             });
       }));

    it('should reflect added elements',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();

               (<number[]>rootTC.debugElement.componentInstance.items).push(3);
               rootTC.detectChanges();

               expect(rootTC.debugElement.nativeElement).toHaveText('1;2;3;');
               async.done();
             });
       }));

    it('should reflect removed elements',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();

               ListWrapper.removeAt(rootTC.debugElement.componentInstance.items, 1);
               rootTC.detectChanges();

               expect(rootTC.debugElement.nativeElement).toHaveText('1;');
               async.done();
             });
       }));

    it('should reflect moved elements',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();

               ListWrapper.removeAt(rootTC.debugElement.componentInstance.items, 0);
               (<number[]>rootTC.debugElement.componentInstance.items).push(1);
               rootTC.detectChanges();

               expect(rootTC.debugElement.nativeElement).toHaveText('2;1;');
               async.done();
             });
       }));

    it('should reflect a mix of all changes (additions/removals/moves)',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [0, 1, 2, 3, 4, 5];
               rootTC.detectChanges();

               rootTC.debugElement.componentInstance.items = [6, 2, 7, 0, 4, 8];
               rootTC.detectChanges();

               expect(rootTC.debugElement.nativeElement).toHaveText('6;2;7;0;4;8;');
               async.done();
             });
       }));

    it('should iterate over an array of objects',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template = '<ul><li template="ng-for #item of items">{{item["name"]}};</li></ul>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {

               // INIT
               rootTC.debugElement.componentInstance.items = [{'name': 'misko'}, {'name': 'shyam'}];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('misko;shyam;');

               // GROW
               (<any[]>rootTC.debugElement.componentInstance.items).push({'name': 'adam'});
               rootTC.detectChanges();

               expect(rootTC.debugElement.nativeElement).toHaveText('misko;shyam;adam;');

               // SHRINK
               ListWrapper.removeAt(rootTC.debugElement.componentInstance.items, 2);
               ListWrapper.removeAt(rootTC.debugElement.componentInstance.items, 0);
               rootTC.detectChanges();

               expect(rootTC.debugElement.nativeElement).toHaveText('shyam;');
               async.done();
             });
       }));

    it('should gracefully handle nulls',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template = '<ul><li template="ng-for #item of null">{{item}};</li></ul>';
         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('');
               async.done();
             });
       }));

    it('should gracefully handle ref changing to null and back',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('1;2;');

               rootTC.debugElement.componentInstance.items = null;
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('');

               rootTC.debugElement.componentInstance.items = [1, 2, 3];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('1;2;3;');
               async.done();
             });
       }));

    it('should throw on ref changing to string',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('1;2;');

               rootTC.debugElement.componentInstance.items = 'whaaa';
               expect(() => rootTC.detectChanges()).toThrowError();
               async.done();
             });
       }));

    it('should works with duplicates',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(TestComponent, TEMPLATE)
             .createAsync(TestComponent)
             .then((rootTC) => {
               var a = new Foo();
               rootTC.debugElement.componentInstance.items = [a, a];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('foo;foo;');
               async.done();
             });
       }));

    it('should repeat over nested arrays',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template = '<div>' +
                        '<div template="ng-for #item of items">' +
                        '<div template="ng-for #subitem of item">' +
                        '{{subitem}}-{{item.length}};' +
                        '</div>|' +
                        '</div>' +
                        '</div>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [['a', 'b'], ['c']];
               rootTC.detectChanges();
               rootTC.detectChanges();
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('a-2;b-2;|c-1;|');

               rootTC.debugElement.componentInstance.items = [['e'], ['f', 'g']];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('e-1;|f-2;g-2;|');

               async.done();
             });
       }));

    it('should repeat over nested arrays with no intermediate element',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template = '<div><template ng-for #item [ng-for-of]="items">' +
                        '<div template="ng-for #subitem of item">' +
                        '{{subitem}}-{{item.length}};' +
                        '</div></template></div>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [['a', 'b'], ['c']];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('a-2;b-2;c-1;');

               rootTC.debugElement.componentInstance.items = [['e'], ['f', 'g']];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('e-1;f-2;g-2;');
               async.done();
             });
       }));

    it('should display indices correctly',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template =
             '<div><copy-me template="ng-for: var item of items; var i=index">{{i.toString()}}</copy-me></div>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('0123456789');

               rootTC.debugElement.componentInstance.items = [1, 2, 6, 7, 4, 3, 5, 8, 9, 0];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('0123456789');
               async.done();
             });
       }));

    it('should display last item correctly',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template =
             '<div><copy-me template="ng-for: var item of items; var isLast=last">{{isLast.toString()}}</copy-me></div>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [0, 1, 2];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('falsefalsetrue');

               rootTC.debugElement.componentInstance.items = [2, 1];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('falsetrue');
               async.done();
             });
       }));

    it('should display even items correctly',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template =
             '<div><copy-me template="ng-for: var item of items; var isEven=even">{{isEven.toString()}}</copy-me></div>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [0, 1, 2];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('truefalsetrue');

               rootTC.debugElement.componentInstance.items = [2, 1];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('truefalse');
               async.done();
             });
       }));

    it('should display odd items correctly',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         var template =
             '<div><copy-me template="ng-for: var item of items; var isOdd=odd">{{isOdd.toString()}}</copy-me></div>';

         tcb.overrideTemplate(TestComponent, template)
             .createAsync(TestComponent)
             .then((rootTC) => {
               rootTC.debugElement.componentInstance.items = [0, 1, 2, 3];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('falsetruefalsetrue');

               rootTC.debugElement.componentInstance.items = [2, 1];
               rootTC.detectChanges();
               expect(rootTC.debugElement.nativeElement).toHaveText('falsetrue');
               async.done();
             });
       }));

    it('should allow to use a custom template',
       inject([TestComponentBuilder, AsyncTestCompleter], (tcb: TestComponentBuilder, async) => {
         tcb.overrideTemplate(
                TestComponent,
                '<ul><template ng-for [ng-for-of]="items" [ng-for-template]="contentTpl"></template></ul>')
             .overrideTemplate(
                 ComponentUsingTestComponent,
                 '<test-cmp><li template="#item #i=index">{{i}}: {{item}};</li></test-cmp>')
             .createAsync(ComponentUsingTestComponent)
             .then((rootTC) => {
               var testComponent = rootTC.debugElement.componentViewChildren[0];
               testComponent.componentInstance.items = ['a', 'b', 'c'];
               rootTC.detectChanges();
               expect(testComponent.nativeElement).toHaveText('0: a;1: b;2: c;');

               async.done();
             });
       }));

  });
}

class Foo {
  toString() { return 'foo'; }
}

@Component({selector: 'test-cmp'})
@View({directives: [NgFor]})
class TestComponent {
  @ContentChild(TemplateRef) contentTpl: TemplateRef;
  items: any;
  constructor() { this.items = [1, 2]; }
}

@Component({selector: 'outer-cmp'})
@View({directives: [TestComponent]})
class ComponentUsingTestComponent {
  items: any;
  constructor() { this.items = [1, 2]; }
}
