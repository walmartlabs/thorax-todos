Todo.todo = (function() {
var module = {exports: {}};
var exports = module.exports;
/* router : todo */
module.name = "todo";
module.routes = {"":"list","todo":"list"};
// todo item model
Todo.Models.TodoItem = Thorax.Model.extend({
  validate: function(attributes) {
    for (name in attributes) {
      if (name === 'label' && !attributes[name]) {
        return [{'name': name, message: 'Enter the todo item'}];
      }
    }
  }
});
;;
// todo items collection
Todo.Models.TodoList = Thorax.Collection.extend({
  model: Todo.Models.TodoItem,

  // list of items that are done
  done: function() {
    return this.filter(function(todo){ return todo.get('done'); });
  },

  // list of items that are not done
  remaining: function() {
    return this.without.apply(this, this.done());
  }
});
;;
Todo.Views.TodoItem = Thorax.View.extend({
  name: 'todo-item',
  events: {
    'change input.check': '_onCheckToggle',
    'dblclick .todo-text': '_onEdit',
    'keypress .todo-input': '_onKeyPress',
    'click .todo-destroy': 'removeItem',
    'blur .todo-input': 'close'
  },

  tagName: 'li',

  render: function() {
    Thorax.View.prototype.render.call(this);
    var self = this;
    this.$('.todo-input').bind('blur', function() {
      self.close();
    });
  },

  removeItem: function() {
    this.model.collection.remove(this.model);
  },

  _onCheckToggle: function(event) {
    this.model.set({"done": event.srcElement.checked});
  },

  _onEdit: function() {
    this.$('input').val(this.model.attributes.label);
    $(this.el).addClass('editing');
    this.$('input').focus();
  },

  _onKeyPress: function(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
      this.close();
    }
  },

  close: function() {
    this.serialize(function(attributes) {
      this.model.set(attributes);
    });
    $(this.el).removeClass('editing');
  }
});
;;
/* handsfree : templates/todo-item.handlebars*/
Todo.templates['templates/todo-item.handlebars'] = Handlebars.compile('<div class=\"display\">\n  <input type=\"checkbox\" class=\"check\" value=\"done\" {{#if done}}checked{{/if}}/>\n  <div class=\"todo-text\">{{label}}</div>\n  <span class=\"todo-destroy\"></span>\n</div>\n<div class=\"edit\">\n  <input name=\"label\" class=\"todo-input\" type=\"text\" value=\"\">\n</div>\n');
Todo.Views.TodoList = Thorax.View.extend({
  name: 'todo-list',
  events: {
    'activated': '_resetStatus',
    'keypress #new-todo': '_onKeyPress',
    'click .remove-items': '_removeCheckedItems',
    collection: {
      'add': '_resetStatus',
      'remove': '_resetStatus',
      'change': '_resetStatus'
    }
  },

  renderEmpty: function() {
    return '';
  },

  // by default, this would return the contents of the item template (list/all-item.handlebars).
  // we'll override to use use a sub-view to show how that would work
  renderItem: function(model, index) {
    var view = this.view('TodoItem');
    view.setModel(model, {fetch: false});
    return view;
  },

  // set the item count status correctly on initial render
  render: function() {
    Thorax.View.prototype.render.call(this);
    this._resetStatus();
  },

  // reset the item count status
  _resetStatus: function() {
    var numberDone = this.collection.done().length;
    var textDone = itemWord(numberDone);
    var numberRemaining = this.collection.remaining().length;
    var textRemaining = itemWord(numberRemaining);
    this.$('#todo-stats').html(this.template('todo-status', {
      number: numberRemaining,
      word: itemWord(numberRemaining),
      numberDone: numberDone,
      wordDone: itemWord(numberDone)
    }));
    this.$('.todo-clear')[(numberDone > 0) ? 'show' : 'hide']();
  },

  // remove this item from the collection
  _removeCheckedItems: function(event) {
    var self = this;
    _.each(this.collection.done(), function(item) {
      self.collection.remove(item.destroy());
    });
  },

  _onKeyPress: function(event) {
    if (event.keyCode === 13) {
      // add a new todo item (when the enter key is pressed)
      var val = $(event.srcElement).val();
      if (val) {
        this.collection.add(new this.collection.model({label: val}));
        $(event.srcElement).val('');
      }
    }
  },

  // make sure we don't add any items with empty labels
  // (the message isn't currently shown because we only have empty string validation)
  _validateInput: function(data) {
    var errors = [];
    if (!data.label) {
      errors.push({key: label, message: 'Please enter the list name'});
    }
    return errors;
  }
});

function itemWord(plurality) {
  if (plurality === 1) return 'item';
  else return 'items';
}
;;
/* handsfree : templates/todo-list.handlebars*/
Todo.templates['templates/todo-list.handlebars'] = Handlebars.compile('<div class=\"title\">\n  <h1>Todos</h1>\n</div>\n\n<div class=\"content\">\n  <div id=\"create-todo\">\n    <input id=\"new-todo\" placeholder=\"What needs to be done?\" type=\"text\" />\n    <span class=\"ui-tooltip-top\" style=\"display:none;\">Press Enter to save this task</span>\n  </div>\n\n  <ul id=\"todo-list\" class=\"collection\"></div>\n\n  <div id=\"todo-stats\"></div>\n</div>\n\n\n');
/* handsfree : templates/todo-status.handlebars*/
Todo.templates['templates/todo-status.handlebars'] = Handlebars.compile('<div id=\"todo-stats\">\n    <span class=\"todo-count\">\n      {{number}}\n      {{word}} left.\n    </span>\n    <span class=\"todo-clear\">\n      <a href=\"#\" class=\"remove-items\">\n        Clear {{numberDone}}\n        completed {{wordDone}}\n      </a>\n    </span>\n</div>\n');
// setup the local cache
var cache = {
    todos: new Todo.Models.TodoList()
};

// create the router.  'module' is created by lumbar.
Thorax.Router.create(module, {

  list: function() {
    var view = this.view('TodoList');
    // render would need to be called if setCollection/setModel is not called
    view.setCollection(cache.todos);
    Todo.layout.setView(view);
  }
});
;;
return module.exports;
}).call(this);
