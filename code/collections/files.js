Files = new Meteor.Collection( 'files' );

Files.allow({
  insert: function() { return false; },
  update: function() { return false; },
  remove: function() { return false; }
});

Files.deny({
  insert: function(){ return true; },
  update: function(){ return true; },
  remove: function(){ return true; }
});
