/*
* Routes: Authenticated
* Routes that are only visible to authenticated users.
*/

Router.route('index', {
  path: '/',
  template: 'index'
});

Router.route( 'upload', {
  path: '/upload',
  template: 'upload',
  onBeforeAction: function(){
    Session.set( "currentRoute", "upload" );
    this.next();
  }
});
