### Getting Started
To get started, we need to add a few packages.

<p class="block-header">Terminal</p>

```bash
meteor add ecmascript 
```
This recipe will be written using the latest version of the JavaScript language, [ES2015](https://babeljs.io/docs/learn-es2015/), which Meteor [introduced support for in version 1.2](http://info.meteor.com/blog/announcing-meteor-1.2). **Note**: this is normally included by default when creating a new project, however, because our code is based on [Base](https://github.com/themeteorchef/base)—which doesn't yet support Meteor 1.2—we need to add this package explicitly here.

<p class="block-header">Terminal</p>

```bash
meteor add edgee:slingshot
```
To send our files to Amazon S3, we'll rely on the [`edgee:slingshot`](https://atmospherejs.com/edgee/slingshot) package. This will give us access to a simple API for uploading files without the need to muck around with the Amazon SDK directly.

<p class="block-header">Terminal</p>

```bash
meteor add fortawesome:fontawesome
```
Purely optional, we'll use the [`fortawesome:fontawesome`](https://atmospherejs.com/fortawesome/fontawesome) package to give us some icons to spruce up our user interface.

<div class="note">
  <h3>Additional Packages <i class="fa fa-warning"></i></h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed above are merely recipe-specific additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://github.com/themeteorchef/base#packages-included">Packages Included list</a> for Base to ensure you have fulfilled all of the dependencies.</p>
</div>

### What are we building?
When we're building our applications, we generally store our static assets like images, documents, and other content in our `/public` folder. For development purposes and smaller applications this is fine, but when we go into production, this can produce unintended consequences in respect to the performance of our application. 

To get around this, we can rely on [cloud services](http://themeteorchef.com/blog/managing-static-content/#tmc-cloud-services) like [Amazon S3](http://themeteorchef.com/blog/managing-static-content/#tmc-amazon-s3) to store our static files _for us_. The reason we choose to do this instead of storing our files locally has to do with resources. Every time a user loads up our app, if we display a static asset on screen—for example, an image—our application has to handle loading that asset directly. 

This means that not only is our application having to load up our templates, logic, and other code, but it's also having to serve up images. This can produce bottlenecks in respect to CPU, memory, and bandwidth usage. By using a service like Amazon S3, we can offset the cost of this by relying on their servers and bandwidth to do the bulk of the work on our behalf.

Another reason using a service like Amazon S3 is important is availability. Our server (and its instances) can only live in one or a few regions at once. This means that if our server "lives" in Chicago and we have users trying to access it from London, those users requests—and our response—have to travel that distance in order for content to be loaded. When it comes to static files, specifically, this can mean waiting several seconds (or longer depending on connection speed) for a file to load up. 

Using Amazon, we can rely on their massive network and pool of resources to speed this process up and make our files available in areas closer to our users.

#### Automatic uploading to Amazon S3
In this recipe, we're going to learn how to automate the process of uploading files to Amazon S3. To do this, we're going to create an interface that does two things:

1. Allows us to click and select a file, or drag and drop it into a "bin" to upload to Amazon S3.
2. Display a list of all of the files we've uploaded to Amazon S3 in reverse chronological order (newest files first). 

Here's what we're after:

<figure>
  <img src="http://cl.ly/image/1K2f311k2E1I/uploading-file.gif" alt="Look at that belly flop!">
  <figcaption>Look at that belly flop!</figcaption>
</figure>

Awesome! When we're done, we'll have an easy way to quickly get files uploaded to Amazon S3. Ready? Let's dig in!

### Setting up Amazon S3
Before we dig into writing code, we should get everything we need from Amazon in place. We need to:

1. Get an Amazon account.
2. Create an Amazon S3 bucket.
3. Add a CORS policy to our bucket.
4. Get our access keys and store them in our application.

Once these are in place, we'll be able to implement our uploading interface much quicker. First, let's hop over to Amazon and set up an account.

#### Getting an account
It's highly likely that you already have an Amazon account set up for personal purchases, but for managing services like S3, it's best if we create a separate account. Nothing _bad_ will happen if you don't create a separate account. But, if you're working with other people and they need access to your account, you wouldn't want them seeing your recent purchase of the [Saved by the Bell: The New Class](https://www.youtube.com/watch?v=TEFcfFUJVuk) box set, would you? Sorry, Robert Sutherland Telfer, you can't replace Zack Morris.

<figure>
  <img src="http://cl.ly/image/2b3o0C1L2e2l/Image%202015-09-22%20at%202.38.38%20PM.png" alt="Entering payment information on Amazon. No such thing as a free lunch, eh Bezos?">
  <figcaption>Entering payment information on Amazon. No such thing as a free lunch, eh Bezos?</figcaption>
</figure>

[Head over to this link](https://console.aws.amazon.com/console/home) and pop in a name, email, and password to get up and running. **Keep in mind, Amazon _will_ make you enter some contact and payment information during this process**. As they'll explain, you _do_ get one year of free service which will get you up to 5GB of free storage, 20,000 GET requests (users loading files), and 2,000 PUT requests (us uploading files). After one year, or, after you've used up these resources, Amazon will charge you for usage.

After this is setup, you will need to verify your identity. If you're trying to score a date for tonight—you too, ladies—this will make you look like a top secret spy. Put your phone on speaker while the Amazon robot calls you to verify your identity and watch your romantic interests' eyes _light up_. You're welcome.

Okay! Once this is set up you will be asked to jump through a few more hoops and then signing in with your new account, you will _finally_ be given access to the AWS dashboard. Don't blame me. [Blame hackers](https://youtu.be/m97Ia9cflPQ?t=1m2s).

#### Setting up an Amazon S3 bucket
Okay, now for what we actually care about! After a bit of Where's Waldo, find [the S3 option in the Amazon AWS Dashboard](https://console.aws.amazon.com/s3/home). Once you're here, you will be prompted to create a bucket. This is what we're after. Click that big blue "Create Bucket" button to get started.

<figure>
  <img src="http://cl.ly/image/28112X0J2E0b/Image%202015-09-22%20at%202.55.17%20PM.png" alt="Setting up a new bucket on Amazon S3.">
  <figcaption>Setting up a new bucket on Amazon S3.</figcaption>
</figure>

We need to pay attention here. First, our `Bucket Name` can only contain lowercase characters and hypens (perhaps more, but I was too lazy to test out all of Amazon's validations). This should be something that we can easily recognize later. Our "bucket" is the place where all of our uploads will live, so it's important to make this descriptive. For example, `myapp-photos` will make it clear that the bucket is for your application's photos feature later.

Next, we need to select a _region_. A region is the location where our bucket will be hosted in respect to Amazon's servers. This is **really important**. You want to select the location from the list that's closest to both you and the majority of your users geographically (on the map). For example, TMC is just outside of Chicago, so the region of choice would be US Standard (which, anecodtally, defaults to Oregon). If you're in the Philippines, you'd probably be best choosing Singapore, Tokyo, or Sydney.

Once this is done, you will have a shiny new bucket to store your files in! Yay? Yay! Next, we need to fast forward a bit and configure our bucket's CORS policy. Let's take a look.

#### Adding a CORS policy to our bucket
CORS stands for [Cross Origin Resource Sharing](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing) and defines a standard for how websites and applications communicate with and allow interactions between one another on the web. Said another way, this is the web's version of a contract between us and the resource we—or our users—are trying to access. In the context of Amazon S3, we need to define a CORS policy that explains _how_ our bucket can be accessed and from _where_. 

While we won't be working with any code from the package just yet, the `edgee:slingshot` package's documentation instructs us to define our CORS policy as follows:

<p class="block-header">CORS Policy</p>

```javascript
<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
    <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>PUT</AllowedMethod>
        <AllowedMethod>POST</AllowedMethod>
        <AllowedMethod>GET</AllowedMethod>
        <AllowedMethod>HEAD</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>*</AllowedHeader>
    </CORSRule>
</CORSConfiguration>
```

XML?! Breathe. To get this added, we need to click on our bucket's name in our list of buckets and click on the silver "Properties" tab (in the middle of "None" and "Transfers") in the top right of the screen. From here, we need to click on the "Permissions" option to reveal the permissions options for our bucket. Once on screen, we need to click the "Edit CORS Configuration" button in the bottom right of the slide down. This will reveal an area for us to paste in the code above. Here's how the process looks on screen:

<figure>
  <img src="http://cl.ly/image/1n1C2L1q3m0K/adding-cors-config.gif" alt="Setting a CORS policy on our bucket.">
  <figcaption>Setting a CORS policy on our bucket.</figcaption>
</figure>

Um, okay. Got it! But what the heck does this mean? Remember that CORS is like a contract specific to the web. More specifically, CORS allows us to define how resources are shared using HTTP requests on the web. When we're interacting with content on the web—or inside of our bucket—we're doing so using HTTP requests (even if they're obscured by fancy JavaScript APIs). Using CORS, we can define what _types_ of requests we allow and _where_ those requests can originate from. 

In this snippet, we're saying that you're allowed to make `PUT`, `POST`, `GET`, and `HEAD` requests on our bucket from any origin domain (e.g. `http://locahost:300`, or, `http://app.com`), and include any [HTTP headers](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields) that you'd like. WHAT?! Doesn't this essentially open our bucket up to the world? Good question. It _would_ if behind the scenes Amazon didn't have any security beyond this in place, but let's be serious: Bezos ain't got time for that.

![Jeff Bezos evil laugh](http://cl.ly/image/0y422f3u3b2r/bXs4mMS.png)

To prevent unwanted requests like this, Amazon gives us access keys (fancy API keys) that we can use to authenticate our uploads. In other words, without these, Amazon will reject our request to do anything.

<div class="note">
  <h3>Customizing CORS <i class="fa fa-warning"></i></h3>
  <p>You may be wondering, "do I have to make this my CORS policy?" Nope! In fact, it's worth spending a little bit of time customizing this to your application's needs. This policy above shouldn't hurt you in any way, but to improve security, you could limit access to certain domains and request types. I haven't tested customizing this with the <code>edgee:slingshot</code> package, though, so your mileage may vary in the context of this recipe. Food for thought!</p>
</div>

Once this is saved, we can grab our access keys and get those set up in our application. Let's take a look.

#### Setting up our access keys
It's important to point out that _how_ we're getting access keys is going against the grain a bit (on purpose). If we navigation over to the [security credentials](https://console.aws.amazon.com/iam/home#security_credential) portion of our AWS dashboard, we'll see a lot of chatter about something called IAM users. What are those? [IAM users](https://aws.amazon.com/iam/) are an Amazon convention for defining user profiles that can have different sets of permissions assigned to them. For example, say we had a clubhouse in our backyard and gave each of our friend's passes to get in. We may have IAM users like:

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Permissions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Jane Smith</td>
      <td>
        - Can use tire swing <br>
        - Can drink Kool-Aid <br>
        - Can visit after school
      </td>
    </tr>
    <tr>
      <td>Joe Smith</td>
      <td>
        - Can use tire swing <br>
        - Can visit after school
      </td>
    </tr>
    <tr>
      <td>Joe Smith</td>
      <td>
        - Can use tire swing
      </td>
    </tr>
  </tbody>
</table>

Obviously this has _nothing_ to do with Amazon S3, but hopefully the example is clear. The idea is that we can allow different users to do certain things based on different rules. In the case of our recipe, we _will not_ be using IAM users.

Instead, [the recommended process](https://github.com/CulturalMe/meteor-slingshot/#security) is to use Amazon's original mechanism for authentication: Access Keys. When you load up the security credentials screen, you can access these by clicking the "Continue to Security Credentials" option and then toggling the "Access Keys (Access Key ID and Secret Access Key)" item in the list on the page revealed after closing the window. Here, you will see an option for creating a new access key. 

![Create Access Key window with key area revealed](http://cl.ly/image/2j102a3k320Y/finding-aws-keys.png)

Click this and then select the blue "Show Access Key" link to reveal your keys.

**THIS IS REALLY IMPORTANT**. You must, must, must, store these keys in a safe, secure location. In the land of Internet Spam Jerks, AWS keys are _pure gold_. Do not let these out into the open! Back them up in a secure location as this will be your only opportunity to do so (e.g. I prefer to use [1password](https://agilebits.com/onepassword) for this) and for the love of all that is holy [do not commit your keys to your public repository](http://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-settingsjson-in-development-vs-production).

<div class="note danger">
  <h3>No joke <i class="fa fa-frown-o"></i></h3>
  <p>This is important because if someone gets access to these, they can start spinning up new services on your behalf. There have been <a href="https://securosis.com/blog/my-500-cloud-security-screwup">several</a> <a href="http://www.devfactor.net/2014/12/30/2375-amazon-mistake/">horror stories</a> of AWS keys being leaked resulting in multi-thousand dollar charges being made by spammers. Do not take this lightly!</p>
</div>

To make use of these in our application, we're going to [rely on using settings.json](http://themeteorchef.com/snippets/making-use-of-settings-json). This will ensure that our keys are not stored in our application code, but also, so we can add our settings files to our `.gitignore` and prevent them from being committed with our repository. Generally speaking, if your repository is **_private_**, it's okay to commit your development/testing keys, but _not_ your production keys. To be safe, it's best to not commit _any_ of your keys, especially those from Amazon. To make sure we do this, in your application add a new file `.gitignore` and add:

<p class="block-header">.gitignore</p>

```bash
settings.json
settings-development.json
settings-production.json
```

Save this and commit _only_ the `.gitignore` file. Got it? Seriously? Good. Backing down the drama a bit, you may be wondering where these files _are_. We need to set them up now, specifically, our `settings-development.json` file. Let's take a look.

<p class="block-header">settings-development.json</p>

```javascript
{
  "AWSAccessKeyId": "<Paste Your Access Key ID Here>",
  "AWSSecretAccessKey": "<Paste Your Secret Access Key Here>"
}
```

This all requires some explaining. First, Meteor gives us the ability to store information like API keys in a file called `settings.json`. By default we usually have this one file, but it's wise to split this up into two: one for development and one for production. The first should contain keys that are created specifically for development purposes while the latter should contain your keys created for _production_ purposes. Note: our `.gitignore` file above includes all three names for safety sake.

This is important. The separation is that we want to keep a clear line between what is being used with live users vs. what is being used with developers. If we're testing an API, for example, we don't want to accidentally push some information using our production keys and have that show up for users. Make sense?

Above, we're demonstrating populating our `settings-development.json` file with the keys we grabbed from the AWS dashboard earlier. To make use of these when we're working on our application, we'll need to make sure that we start our Meteor server by running the command `meteor --settings settings-development.json`. If you're curious, yes, you can [automate this by creating NPM scripts](http://themeteorchef.com/snippets/making-use-of-settings-json/#tmc-automating-settingsjson) that load up the correct file depending on your application's environment.

Once these are in place, we're done configuring Amazon and are ready to write some code to make our uploading work. Let's dive in!

### Creating the upload form
First up, we need to create a form for actually _uploading_ our files. This includes two steps: creating a parent template where our form will live (along with our list of uploads) and then creating the child template with the actual form. Let's take a look:

<p class="block-header">/client/templates/authenticated/upload.html</p>

```markup
<template name="upload">
  <h4 class="page-header">Upload a File to Amazon S3</h4>
  {{> uploader}}
</template>
```
Pretty straightforward. Here, we simply give our page a title and then add an include for our `{{> uploader}}` template. We'll be updating this `upload` template later to include our list of files, but for now, let's jump over to our `uploader` template and see how that's shaping up.

<p class="block-header">/client/templates/authenticated/uploader.html</p>

```markup
<template name="uploader">
  <div class="upload-area">
    <form id="upload">
      <p class="alert alert-success text-center">
        <span>Click or Drag a File Here to Upload</span>
        <input type="file">
      </p>
    </form>
  </div>
</template>
```
Simple as well! Nice! Here, we've created a long "bar" interface where users can either click to add files, or, drag and drop their files. We're not doing anything special for the drag and drop here. We're getting this for free in browsers that support it. As a fallback, we have a vanilla `file` input. To make this not look totally apalling, we've added a bit of CSS to make our input stretch across our click/drop zone invisibly. For reference, here's the CSS to do it:

<p class="block-header">/client/stylesheets/components/_upload.scss</p>

```css
.upload-area .alert {
  position: relative;
}

.upload-area input[type="file"] {
  position: absolute;
  top: 0px;
  left: 0px;
  right: 0px;
  bottom: 0px;
  width: 100%;
  opacity: 0;
}
```
Pretty simple! To do the stretch we use absolute positioning on the file input and then make it "invisible" by setting its opacity to `0`. Now, if we click anywhere in the click/drop zone, or, drag a file and drop it, we'll get the native input file behavior. Nice!

That's it for the uploader template. Now, we get to the good stuff: making it store files on S3!

### Wiring up our uploader
In order to get our uploader working, we need to add a bit of logic to our `uploader` template. Let's crack open the JS file for that now and add an event handler to make this function.

<p class="block-header">/client/templates/authenticated/uploader.js</p>

```javascript
Template.uploader.events({
  'change input[type="file"]' ( event, template ) {
    Modules.client.uploadToAmazonS3( { event: event, template: template } );
  }
});
```
Nothing to it. Here, we're adding an event handler that watches for changes on our file input. This allows us to account for both clicking to select a file as well as a file being dropped. The "change" that occurs is a file being set. When this happens, we'll fire the code in our event handler. Neat!

But wait...what is this `Modules.client.uploadToAmazonS3()` business? Well, because our process for uploading involves a few different steps, we're going to bake that process into a module. A module is nothing more than a way to separate and organize our code. This allows us to do things like reuse complicated functions and break complex tasks into multiple steps so they're easier to understand and debug if we run into problems.

<div class="note info">
  <h3>This is a Meteor Chef thing <i class="fa fa-info"></i></h3>
  <p>This process is <em>not required</em>. The choice to use a module pattern here is done as a demonstration of breaking up complex tasks into more manageable code. If you have your own way of doing things, by all means, feel free to break up the examples into your own patterns!</p>
</div>

To get our modules working, notice we've set up a namespace `Modules`, followed by the name of the location where this code is expected to run `client` and then the name of the function we'd like to call `uploadToAmazonS3`. The naming convention here implies how this organization pattern works. Modules are located in three directories in our application `/both/modules`, `/client/modules`, and `/server/modules`. The first, `/both/modules`, fulfills two purposes: it sets up the global namespace `Modules` as `Modules = {};` making it available to both the client and server, as well as another namespace, `Modules.both = {};`. 

This may be a bit confusing at first, but notice that these are defined as _global_ variables, meaning they're accessible throughout our application. We define each of the "location" namespaces from within the location. Real quick, here is how namespaces are defined based on the location of where the code will run:

<p class="block-header">/both/modules/_modules.js</p>

```javascript
Modules      = {};
Modules.both = {};
```

<p class="block-header">/client/modules/_modules.js</p>

```javascript
Modules.client = {};
```

<p class="block-header">/server/modules/_modules.js</p>

```javascript
Modules.server = {};
```

Notice that we only define `Modules = {};` once because we define it in our `/both` directory whose contents are accessible on both the client and the server. From there, we can assign the client and server namespaces accordingly. Take a second to play with this if it's unfamiliar by opening up your browser console and attempting to access `Modules`, `Modules.client`, and `Modules.server`. You'll notice that if you log `Modules` in the browser, it will only have `Modules.both` and `Modules.client` defined. On the server, we see the same but instead of `both` and `client`, we get `server`. 

If this is confusing, hang in there. Let's look at our module code for uploading files. Once we see it in process it should make better sense.

#### The `uploadToAmazonS3` module
The idea behind our module is to keep all of the code pertaining to one task (in this case, uploading files to Amazon) contained within _a single file_. Then, inside of that file, we break up each of the steps that make up that task into _individual functions_. Why? Clarity. 

When we do this, it makes it extremely clear to see how information is flowing in-and-out of our module. The reason this is important is that it makes it very easy to debug our code, but also, for others to make sense of our code later if we're not around. Let's get a skeleton file set up and then explain each function's purpose.

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
let upload = ( options ) => {
  [...]
};

Modules.client.uploadToAmazonS3 = upload;
```

We start by assigning a single function `upload` to our namespace `Modules.client.uploadToAmazonS3`. The idea behind this is that even though our file will contain several functions, we only want to assign _one_ function to our namespace, or, make one function _public_. With this assignment, whenever we call `Modules.client.uploadToAmazonS3()` we're technically calling `upload()`. The namespace, then, is used to make sure our function doesn't clash with any others because we're making this a global variable. Hang in there! 

Let's add a little bit of functionality inside of our `upload` function. I promise this will make sense by the time we wrap up.

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  _uploadFileToAmazon( file );
};

Modules.client.uploadToAmazonS3 = upload;
```

Okay. We've got a few things going on in here. First, we start by assigning a variable `template` equal to the value of `options.template`. Notice that `options` is the single argument passed to our `upload` function. What's going on here? Well, because we've assigned our `upload` function to our namespace `Modules.client.uploadToAmazonS3`, when that's invoked, anything that's passed to it gets passed to our `upload` function. Real quick, here's an example invocation of our module:

<p class="block-header">Example of calling Modules.client.uploadToAmazonS3</p>

```javascript
Modules.client.uploadToAmazonS3( { template: "something", event: "something else" } );
```
Notice that we're not passing single arguments, here, but a single _object_. In our `upload` function, then, when we call `options.template`, this value will equal `"something"`. Make sense? Arguments passed to our namespace are just passed along to the function we've _assigned_ to that namespace. Magic! To be clear, this is a JavaScript convention, not Meteor.

Back in our `upload` function, then, we assign the `template` variable to the value assigned to the `template` key inside of our `options` object. Making a little more sense? But wait...where is this `template` variable coming from? We need to add this. Here's how our module looks with it added:

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
let template;

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  _uploadFileToAmazon( file );
};

Modules.client.uploadToAmazonS3 = upload;
```

Better? Here, we're defining our `template` variable using `let` ([an ES2015 convention](http://themeteorchef.com/blog/what-is-es2015/#tmc-let-const) for defining mutable variables). To make sure our `template` variable is accessible throughout our module, we move its definition outside of our function. Using `let`, our variable is scoped to the parent block, meaning, if we defined it inside of our `upload` function, the functions we add later wouldn't be able to access it. Again, hang in there, this will make sense in a bit.

Next, we assign a new variable `file` equal to the response of a function `_getFileFromInput()`. Just like our `template` variable, we're going to define this function just above our `upload` function. Here's how it looks:

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
let template;

let _getFileFromInput = ( event ) => event.target.files[0];

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );
  [...]
};

Modules.client.uploadToAmazonS3 = upload;
```

It's pretty simple. Just a one-liner. The purpose of this function is to take the change event from our file input and grab the information about the file our user selected. Here, we use ES2015 [expression syntax](http://themeteorchef.com/blog/what-is-es2015/#tmc-statement-and-expression-bodies) to shorten up our code a bit. Remember, we can use this when our functions only contain a single line. Using this, we get an explicit return (meaning we can omit `return` from our definition). To be clear, when this is called, here's what we're getting back:

```javascript
{
  lastModified: 1442949426000
  lastModifiedDate: Tue Sep 22 2015 14:17:06 GMT-0500 (CDT)
  name: "corgi-flop.gif"
  size: 992607
  type: "image/gif"
  webkitRelativePath: ""
  __proto__: File
}
```
What is this mumbo jumbo? This is the information about the file currently assigned to our file input, or, the file the user selected. As we'll see in a bit, this is what we'll pass to our uploader function to push our file to Amazon. We grab this inside of our `_getFileFromInput()` function because we'll need to access this value more than once in our module.

<div class="note info">
  <h3>What's with the underscore in front? <i class="fa fa-info"></i></h3>
  <p>This is a convention used in web development to denote a <em>private</em> variable. It doesn't do anything special (the underscore isn't recognized by JavaScript). This is purely an identifier for developers to understand which functions are meant to be just for the current file and which can be exported or made global.</p>
</div>

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
let template;

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  [...]
};

Modules.client.uploadToAmazonS3 = upload;
```

Back in our `upload` function, we're defining another function called `_setPlaceholderText()`. Any idea what this function is responsible for? Let's take a look.

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
[...]

let _setPlaceholderText = ( string = "Click or Drag a File Here to Upload" ) => {
  template.find( ".alert span" ).innerText = string;
};

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  [...]
};

Modules.client.uploadToAmazonS3 = upload;
```

Okay! Now we're making a little more sense here. First, notice that we're passing a string to this function <code>Uploading ${file.name}...</code>. Here, we're using ES2015's [template strings](http://themeteorchef.com/blog/what-is-es2015/#tmc-template-strings) feature to pass a variable directly to our string (in this case, the name of the file selected in our input, or, `corgi-flop.gif`). In our function definition, we're using _another_ feature of ES2015, [argument defaults](https://babeljs.io/docs/learn-es2015/#default-rest-spread), to say "if we don't pass a string when calling `setPlaceholderText()`, set the value of the `string` argument to 'Click or Drag a File Here to Upload.'"

Once we have a value for `string`, we make use of the `template` variable we set up a little bit ago (this is assigned to the value of the template instance where the change event happened on our input), attempting to find the `.alert span` element and setting its `innerText` property equal to our string. Phew! This should be starting to make a little more sense. For each explicit task involved in uploading our file, we break it off into its own function. First we grabbed the file from our input, now we're setting the placeholder text.

Let's keep on chuggin' and look at the last function we're calling in our `upload` function.

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
[...]

let _uploadFileToAmazon = ( file ) => {
  const uploader = new Slingshot.Upload( "uploadToAmazonS3" );

  uploader.send( file, ( error, url ) => {
    if ( error ) {
      Bert.alert( error.message, "warning" );
      _setPlaceholderText();
    } else {
      [...]
    }
  });
};

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  _uploadFileToAmazon( file );
};

Modules.client.uploadToAmazonS3 = upload;
```

Hmm. See where this is heading? Inside of `_uploadFileToAmazon`, we're passing in the file that we pulled from our change event with `_getFileFromInput()`. Inside, we're finally getting to our upload code. First, we're defining  a new constant `uploader` and assigning it to an instance of `Slingshot.Upload()`, passing the name of a "directive"—`uploadToAmazonS3`—that we'll define on the server later.

Next, we invoke our `uploader` instance's `send` method, passing in the file from our input. At this point, we're making a call to Amazon S3 behind the scenes to get our file uploaded. Real quick, let's jump up to the server to see how we configure Slingshot to handle this process.

#### Configuring Slingshot on the server
In order to actually make our uploads to Amazon S3 work via Slingshot, we need to configure a few things on the server.

<p class="block-header">/server/slingshot.js</p>

```javascript
Slingshot.fileRestrictions( "uploadToAmazonS3", {
  allowedFileTypes: [ "image/png", "image/jpeg", "image/gif" ],
  maxSize: 1 * 1024 * 1024
});

Slingshot.createDirective( "uploadToAmazonS3", Slingshot.S3Storage, {
  bucket: "<name-of-our-bucket>",
  acl: "public-read",
  authorize: function () {
    let userFileCount = Files.find( { "userId": this.userId } ).count();
    return userFileCount < 3 ? true : false;
  },
  key: function ( file ) {
    var user = Meteor.users.findOne( this.userId );
    return user.emails[0].address + "/" + file.name;
  }
});
```

<!-- comment -->

Two methods to pay attention to: `Slingshot.fileRestrictions()` and `Slingshot.createDirective()`. The first is pretty clear. Here, we set to things: an array of allowed file types and a maximum size for each file that gets uploaded. For `maxSize` we do a calculation on the number of `bytes` allowed. For our example, we've set this equal to `1MB` or `1 byte` times `1024` times `1024`. For clarity, there are `1024` bytes in a kilobyte and `1024` kilobytes in a megabye. Math!

Once our file restrictions are in place, we define our upload directive. Notice, this is where that `uploadToAmazonS3` name is coming from in all of our calls to `Slingshot`. We let Slingshot know that we want to use S3 storage (it supports [multiple services](https://github.com/CulturalMe/meteor-slingshot/#storage-services)), and then we pass an options object. First, we pass the name of the bucket we set up earlier. Next, we have an option `acl` set to `public-read`. This value corresponds to something Amazon defines as a [canned ACL](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl), or pre-defined Access Control List. In Bezos Land™, an ACL defines _who_ can access our data and _how_. This is similar to our CORS configuration from earlier. As explained by Amazon:

> Amazon S3 Access Control Lists (ACLs) enable you to manage access to buckets and objects. Each bucket and object has an ACL attached to it as a subresource. It defines which AWS accounts or groups are granted access and the type of access. When a request is received against a resource, Amazon S3 checks the corresponding ACL to verify the requester has the necessary access permissions.
>
> &mdash; via [Amazon ACL Overview](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html)

This setting `public-read` is [a pre-made ACL](http://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl) given to us by Amazon which specifies that "Owner gets `FULL_CONTROL`. The AllUsers group gets `READ` access." In other words, _we_ can do whatever we want to our bucket but our users and other third-parties can only _read_ content from it. Of course, we can get as specific as we'd like with this, [defining our own ACLs](http://docs.aws.amazon.com/AmazonS3/latest/dev/manage-acls-using-console.html) and passing the names of those here instead. 

Next, we have a method `authorize` which returns `true` if the current user has less than `3` files uploaded and `false` if they already have `3`. This is a simple example, but the idea here is that we can implement any logic we'd like to block uploads from happening. Here, we implement a simple max upload quota of `3` files, but you could get creative and check something like a user's subscription to see if they're allowed to upload more files. Up to you!

Finally, we call a method `key` which takes a `file` argument equal to the file we've passed from the client. Here, `key` is used to return the name used for the location within the bucket where the file will be saved. Here, we've decided to namespace uploads based on the current user's email addres, so if we uploaded a file `corgi-flip.gif`, it would be added to a directory `email@email.com/corgi-flop.gif`. Cool! You can make this anything you'd like as long as it's a valid file structure.

<div class="note info">
  <h3>Where are our access keys? <i class="fa fa-info"></i></h3>
  <p>Remeber when we set our access keys inside of our <code>settings-development.json</code> file earlier and mentioned starting our server with this in tow? Well, behind the scenes, the <code>edgee:slingshot</code> package knows to look in our settings file for the values we specified. To make this all work, they take our keys and generate an Amazon <a href="http://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp.html">Session Token</a> to remove the need to send our keys over the wire to Amazon.</p>
</div>

That's it! We're all conigured on the server, so now we can go back to the client to finish up our module.

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
[...]

let _uploadFileToAmazon = ( file ) => {
  const uploader = new Slingshot.Upload( "uploadToAmazonS3" );

  uploader.send( file, ( error, url ) => {
    if ( error ) {
      Bert.alert( error.message, "warning" );
      _setPlaceholderText();
    } else {
      _addUrlToDatabase( url );
    }
  });
};

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  _uploadFileToAmazon( file );
};

Modules.client.uploadToAmazonS3 = upload;
```

Back in our `_uploadFileToAmazon()` function, notice we pass a simple callback to our `uploader.send` call to handle our error and success states. If we have an error, we alert its `message` property to the client and reset the placeholder text on our uploader (remember, if we don't pass a string to this function, it gets assigned to the default value `"Click or Drag a File Here to Upload"`. On success, we call to one last function we need to define `_addUrlToDatabase()` passing the `url` (this is the URL of our file on Amazon S3). Let's take a look.

<p class="block-header">/client/modules/upload-to-amazon-s3.js</p>

```javascript
[...]

let _addUrlToDatabase = ( url ) => {
  Meteor.call( "storeUrlInDatabase", url, ( error ) => {
    if ( error ) {
      Bert.alert( error.reason, "warning" );
      _setPlaceholderText();
    } else {
      Bert.alert( "File uploaded to Amazon S3!", "success" );
      _setPlaceholderText();
    }
  });
};

let _uploadFileToAmazon = ( file ) => {
  [...]
};

let upload = ( options ) => {
  template = options.template;
  let file = _getFileFromInput( options.event );

  _setPlaceholderText( `Uploading ${file.name}...` );
  _uploadFileToAmazon( file );
};

Modules.client.uploadToAmazonS3 = upload;
```

Pretty simple. Inside we find a good ol' fashioned method call to a method we've defined on our server `storeUrlInDatabase`. At this point the callback on this should be pretty clear: an alert with the error and resetting the uploader text on error and the inverse on success. 

This completes our `uploadToAmazonS3` module here on the client, so let's hop back up to the server to see how our `storeUrlInDatabase` method is working. Hint: it's pretty neat.

### Storing Amazon URLs in the database
At this point we have our files uploading to Amazon S3, however, we can't really _see_ them. In order to confirm—just beyond a success message—that our files have uploaded, we want to _store_ the URLs we get back from Amazon so we can display them back on the page for reference. To do this, we've setup a method that gets called _after_ we've successfully pushed a file to Amazon and have gotten back a URL for the file.

<p class="block-header">/both/methods/insert/files.js</p>

```javascript
Meteor.methods({
  storeUrlInDatabase: function( url ) {
    check( url, String );
    Modules.both.checkUrlValidity( url );

    try {
      Files.insert({
        url: url,
        userId: Meteor.userId(),
        added: new Date() 
      });
    } catch( exception ) {
      return exception;
    }
  }
});
```
Simple. Here, we have a simple method setup to do a few things. First, we call a `check` on the URL we've passed to make it a string. Next, we call a new module `checkUrlValidity` passing our URL. Just beneath that, we do a `try/catch` and attempt to insert our file into the database, assigning it to the current user and giving it a date equal to "now." What is that `checkUrlValidity` module up to?

#### The `checkUrlValidity` module
Before we clear our URLs to be inserted into our database, we need to make one last stop. Technically this is a mix of paranoia and security. We want to confirm two things: does this URL already exist in the database, and, is this URL a URL from Amazon? Since we did a deep dive on the `uploadToAmazonS3` module, we're going to just dump this one out and step through the high-level concepts.

<p class="block-header">/both/modules/check-url-validity.js</p>

```javascript
let _fileExistsInDatabase = ( url ) => {
  return Files.findOne( { "url": url, "userId": Meteor.userId() }, { fields: { "_id": 1 } } );
};

let _isNotAmazonUrl = ( url ) => {
  return ( url.indexOf( 's3.amazonaws.com' ) < 0 );
};

let _validateUrl = ( url ) => {
  if ( _fileExistsInDatabase( url ) ) {
    return { valid: false, error: "Sorry, this file already exists!" };
  }

  if ( _isNotAmazonUrl( url ) ) {
    return { valid: false, error: "Sorry, this isn't a valid URL!" };
  }

  return { valid: true };
};

let validate = ( url ) => {
  let test = _validateUrl( url );

  if ( !test.valid ) {
    throw new Meteor.Error( "file-error", test.error );
  }
};

Modules.both.checkUrlValidity = validate;
```
Here, we've broken up validating our URL into three discrete tasks:

1. Checking whether the URL exists in our database.
2. Checking whether the URL is from Amazon.
3. Returning an error message to throw if #1 or #2 fail.

The meat of our module is in the `_validateUrl()` function where we first check if the file already exists in the database. If it does, we return an object with a `valid` property set to false and an `error` message that explains the file already exists. 

Following this pattern, we perform an additional check to see if the URL contains `s3.amazonaws.com`, meaning, the URL is from Amazon. We do this here as a "paranoia" check to make sure that someone hasn't attempted to insert a URL into our database from the client by calling our `storeUrlInDatabase` method and passing a bogus URL.

Cool! As we can see, back in our main `validate` function (the one we're assigning our `checkUrlValidity` namespace to), if we return an object where the `valid` property is false, we throw an error using `Meteor.Error`, passing the message assigned to the object in our `_validateUrl` function. Wow!

This one is simple, but important for preventing unwanted data from getting into our database. Because we've built this using a module pattern, if we think of additional validations in the future, we can snap them in without a lot of trouble. Sweet!

Okay. Last step. We've got our files on Amazon and in our database, now, we just need to get them on the template.

### Displaying files
This one is pretty easy. We need to do two things: [set up a publication](http://themeteorchef.com/snippets/publication-and-subscription-patterns/#tmc-publications) for our data to get it on the client and then setup a template and some logic to output that data.

<p class="block-header">/server/publications/files.js</p>

```javascript
Meteor.publish( 'files', function(){
  var data = Files.find( { "userId": this.userId } );

  if ( data ) {
    return data;
  }

  return this.ready();
});
```
Very simple. We make a call on our `Files` collection, finding all of the items where the `userId` field matches the ID of the currently logged in user (we can retrieve this within our publication using `this.userId` as a convenience baked into Meteor).

Next, we need to update our `upload` template from earlier to include a new template for displaying our files:

<p class="block-header">/client/templates/authenticated/upload.html</p>

```markup
<template name="upload">
  <h4 class="page-header">Upload a File to Amazon S3</h4>
  {{> uploader}}
  {{> files}}
</template>
```

Cool. Pretty easy. We're just going to display our list of files beneath our uploader input. Next, we need to get the `files` template setup.

<p class="block-header">/client/templates/authenticated/files.html</p>

```markup
<template name="files">
  <div class="files">
    {{#each files}}
      {{> file}}
    {{else}}
      <p class="alert alert-warning">No files uploaded yet!</p>
    {{/each}}
  </div>
</template>
```

Also simple. Here, we setup an `{{#each}}` block tied to a helper `files`. If we have files, we output the `{{> file}}` template, and if not, we display a warning message. Let's look at the logic for this `files` template.

<p class="block-header">/client/templates/authenticated/files.js</p>

```javascript
Template.files.onCreated( () => Template.instance().subscribe( 'files' ) );

Template.files.helpers({
  files() {
    var files = Files.find( {}, { sort: { "added": -1 } } );
    if ( files ) {
      return files;
    }
  }
});
```

Two things happening here. First, we subscribe to our `files` publication we just setup using that nifty [expression syntax](http://themeteorchef.com/blog/what-is-es2015/#tmc-statement-and-expression-bodies) added in ES2015. Notice, because we're using the Arrow syntax meaning our scope is set to _outside_ of the current function, we add our subscription to our template using `Template.instance().subscribe()` instead of `this.subscribe()`. The two are equal, but this helps us get around the scoping issue while keeping the clean syntax (and arguably makes this a little clearer).

Next, we setup a simple `files()` helper to return all of the files published to the client (remember, our publication is only sending down files owned by our current user so no need to filter again), sorting those items based on the date `added` field in reverse chronological order (most recent to oldest). Almost there! One last step, our `file` template.

<p class="block-header">/client/templates/authenticated/file.html</p>

```markup
<template name="file">
  <div class="file">
    <div class="preview">
      <a href="{{url}}" target="_blank"></a>
      {{#if isImage url}}
        <img src="{{url}}" alt="{{url}}">
      {{else}}
        <i class="fa fa-file-o"></i>
      {{/if}}
    </div>
    <input type="text" class="form-control" value="{{url}}">
  </div>
</template>
```

Making sense? We output the `{{url}}` of the currently output file into a few different places: a link to the file, a text input to make copying the URL easy, and then finally, if we determine the URL passed is an image, we set the `{{url}}` to an image tag, and if not, simply return a generic file icon. Let's look at our logic for the `isImage` helper real quick.

<p class="block-header">/client/templates/authenticated/file.js</p>

```javascript
Template.file.helpers({
  isImage( url ) {
    const formats = [ 'jpg', 'jpeg', 'png', 'gif' ];
    return _.find( formats, ( format ) => url.indexOf( format ) > -1 );
  }
});
```

Here, we take the URL passed as the argument to our `{{#if}}` block and make use of the Underscore [`_.find()`](http://underscorejs.org/#find) method to loop over an array of file formats. Inside of our `find()`, we test our URL to see if it contains the format, returning `true` if it does and `false` otherwise. 

If it's not clear, the goal of this helper allows us to determine at the template level whether or not the file we're trying to show is an image. If it is, we want to display a thumbnail of that image. If it isn't, we show our placeholder icon instead!

Drumroll please...we're done! We have a complete solution for uploading files to Amazon S3 and getting a preview of items uploaded in our application. Job well done.

### Wrap Up &amp; Summary
In this recipe, we learned how to upload files to Amazon S3 using the [edgee:slingshot](https://atmospherejs.com/edgee/slingshot) package. We learned how to get an account on Amazon and configure a bucket in their S3 service, setup CORS configuration, and wrapped our head around the access control list concept. We also took a close look at using a module pattern for organizing our code when performing tasks involing multiple steps.