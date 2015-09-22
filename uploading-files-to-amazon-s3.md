### Getting Started
To get started, we need to add a few packages.

<p class="block-header">Terminal</p>

```bash
meteor add ecmascript 
```
This recipe will be written using the latest version of the JavaScript language, ES2015, which Meteor introduced support for in version 1.2. **Note**: this is normally included by default when creating a new project, however, because our code is based on [Base](https://github.com/themeteorchef/base)—which doesn't yet support Meteor 1.2—we need to add this package explicitly here.

<p class="block-header">Terminal</p>

```bash
meteor add edgee:slingshot
```
To send our files to Amazon S3, we'll rely on the [`edgee:slingshot`](atmospherejs.com/edgee/slingshot) package. This will give us access to a simple API for uploading files without the need to muck around with the Amazon SDK directly.

<p class="block-header">Terminal</p>

```bash
meteor add fortawesome:fontawesome
```
Purely optional, we'll use the [`fortawesome:fontawesome`](atmospherejs.com/fortawesome/fontawesome) package to give us some icons to spruce up our user interface.

<div class="note">
  <h3>Additional Packages <i class="fa fa-warning"></i></h3>
  <p>This recipe relies on several other packages that come as part of <a href="https://github.com/themeteorchef/base">Base</a>, the boilerplate kit used here on The Meteor Chef. The packages listed above are merely recipe-specific additions to the packages that are included by default in the kit. Make sure to reference the <a href="https://github.com/themeteorchef/base#packages-included">Packages Included list</a> for Base to ensure you have fulfilled all of the dependencies.</p>
</div>

### What are we building?
When we're building our applications, we generally store our static assets like images, documents, and other content in our `/public` folder. For development purposes and smaller applications this is fine, but when we go into production, this can produce unintended consequences in respect to the performance of our application. 

To get around this, we can rely on [cloud services]() like [Amazon S3]() to store our static files _for us_. The reason we choose to do this instead of storing our files locally has to do with resources. Every time a user loads up our app, if we display a static asset on screen—for example, an image—our application has to handle loading that asset directly. 

This means that not only is our application having to load up our templates, logic, and other code, but it's also having to serve up images. This can produce bottlenecks in respect to CPU and memory usage. By using a service like Amazon S3, we can offset the "cost" of this by relying on their servers and bandwidth to do the bulk of the work on our behalf.

Another reason using a service like Amazon S3 is important is availability. Our server (and its instances) can only live in one or a few regions at once. This means that if our server "lives" in Chicago and we have users trying to access it from London, those users requests—and our response—have to travel that distance in order for content to be loaded. When it comes to static files, specifically, this can me waiting several seconds (or longer depending on connection speed) for a file to load up. 

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
It's highly likely that you already have an Amazon account set up for personal purchases, but for managing services like S3, it's best if we create a separate account. Nothing _bad_ will happen, but if you're working with other people and they need access to your account, you wouldn't want them seeing your recent purchase of the [Saved by the Bell: The New Class](https://www.youtube.com/watch?v=TEFcfFUJVuk) box set, would you?

<figure>
  <img src="http://cl.ly/image/2b3o0C1L2e2l/Image%202015-09-22%20at%202.38.38%20PM.png" alt="Entering payment information on Amazon. No such thing as a free lunch, eh Bezos?">
  <figcaption>Entering payment information on Amazon. No such thing as a free lunch, eh Bezos?</figcaption>
</figure>

[Head over to this link](https://console.aws.amazon.com/console/home) and pop in a name, email, and password to get up and running. **Keep in mind, Amazon _will_ make you enter some contact and payment information during this process**. As they'll explain, you _do_ get one year of free service which will get you up to 5GB of free storage, 20,000 GET requests (users loading files), and 2,000 PUT requests (us uploading files). After one year, or, after you've used up these resources, Amazon will charge you for usage.

After this is setup, you will need to verify your identity. If you're trying to score a date for tonight—you too, ladies—this will make you look like a top secret spy. Put your phone on speaker phone while the Amazon robot calls you to verify your identity and watch your romantic interests' eyes _light up_. You're welcome.

Okay! Once this is set up you will be asked to jump through a few more hoops and then signing in with your new account, you will _finally_ be given access to the AWS dashboard. Don't blame me. [Blame hackers](https://youtu.be/m97Ia9cflPQ?t=1m2s).

#### Setting up an Amazon S3 bucket
Okay, now for what we actually care about! After a bit of Where's Waldo, find [the S3 option in the Amazon AWS Dashboard](https://console.aws.amazon.com/s3/home). Once you're here, you will be prompted to create a bucket. This is what we're after. Click that big blue button "Create Bucket" to get started.

<figure>
  <img src="http://cl.ly/image/28112X0J2E0b/Image%202015-09-22%20at%202.55.17%20PM.png" alt="Setting up a new bucket on Amazon S3.">
  <figcaption>Setting up a new bucket on Amazon S3.</figcaption>
</figure>

We need to pay attention here. First, our `Bucket Name` can only contain lowercase characters and hypens (perhaps more, but I was too lazy to test out all of Amazon's validations). This should be something that we can easily recognize later. Our "bucket" is the place where all of our uploads will live, so it's important to make this descriptive. For example, `myapp-photos` will make it clear that the bucket is for your application's photos later.

Next, we need to select a _region_. A region is the location where our bucket will be hosted in respect to Amazon's servers. This is **really important**. You want to select the location from the list that's closest to both you and the majority of your users geographically (on the map). For example, TMC is just outside of Chicago, so the region of choice would be US Standard (which, anecodtally, defaults to Oregon). If you're in the Philippines, you'd probably be best choosing Singapore, Tokyo, or Sydney.

<div class="note success">
  <h3>This is it? <i class="fa fa-thumbs-up"></i></h3>
  <p>Don't worry, we'll learn how to make our content available in multiple regions later when we learn about Amazon CloudFront. Hang tight!</p>
</div>

Once this is done, you will have a shiny new bucket to store your files in! Yay? Yay! Next, we need to fast forward a bit and configure our bucket's CORS policy. Let's take a look.

#### Adding a CORS policy to our bucket
CORS stands for Cross Origin Resource Sharing and defines a standard for how applications communicate with and allow interactions between one another on the web. Said another way, this is the web's version of a contract between us and the resource we—or our users—are trying to access. In the context of Amazon S3, we need to define a CORS policy that explains _how_ our bucket can be accessed and from where. 

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

In this snippet, we're saying that you're allowed to make `PUT`, `POST`, `GET`, and `HEAD` requests on our bucket from any origin domain (e.g. `http://locahost:300`, or, `http://app.com`), and include any [HTTP headers]() that you'd like. WHAT?! Doesn't this essentially open our bucket up to the world? Good question. It _would_ if behind the scenes Amazon didn't have any security beyond this in place, but let's be serious: Bezos ain't got time for that.

![Jeff Bezos evil laugh](http://cl.ly/image/0y422f3u3b2r/bXs4mMS.png)

To prevent unwanted requests like this, Amazon gives us access keys (fancy API keys) that we can use to authenticate our uploads. In other words, without these, Amazon will reject our request to do anything.

<div class="note">
  <h3>Customizing CORS <i class="fa fa-warning"></i></h3>
  <p>You may be wondering, "do I have to make this my CORS policy?" Nope! In fact, it's worth spending a little bit of time customizing this to your application's needs. This policy above shouldn't hurt you in any way, but to improve security, you could limit access to certain domains and request types. I haven't tested customizing this with the <code>edgee:slingshot</code> package, though, so your mileage may vary in the context of this recipe. Food for thought!</p>
</div>

Once this is saved, we can grab our access keys and get those set up in our application. Let's take a look.

#### Setting up our access keys
It's important to point out that _how_ we're getting access keys is going against the grain a bit (on purpose). If we navigation over to the [security credentials]() portion of our AWS dashboard, we'll see a lot of chatter about something called IAM users. What are those? IAM users are an Amazon convention for defining user profiles that can have different sets of permissions assigned to them. For example, say we had a clubhouse in our backyard and gave each of our friend's passes to get in. We may have IAM users like:

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
### Displaying files
### Configuring Amazon CloudFront
