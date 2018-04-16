var WooCommerceAPI = require('woocommerce-api');
var WooCommerceOption = {
    url: 'https://example.com',
    consumerKey: 'consumer_key',
    consumerSecret: 'consumer_secret',
    wpAPI: true,
    version: 'wc/v2'
};

var checkRoute = function(option)
{
    var mName   = option.mName;
    var button = fn.getModuleData(mName, 'menuItem').value;
    var btnsArr  = [button];

    var result = {}
    //check text message
    if(option.text) btnsArr.forEach(btn => { 
        if(option.text === btn) 
        {
            result.status = true; 
            result.button = btn;
            result.routting = routting;
        }
    });

    //check seperate section
    if(option.speratedSection){
        option.speratedSection.forEach(section => {
            btnsArr.forEach(btn => 
            { 
                if(section === btn){
                    result.status = true; 
                    result.button = btn;
                    result.routting = routting;
                }
            });
        });
    }

    //return
    return result;
}

var getWooCommerceAPI = function(userid)
{
    var mName = 'woocommerce';
    var url = fn.getModuleData(mName, 'url');
    var consumerKey = fn.getModuleData(mName, 'consumerKey');
    var consumerSecret = fn.getModuleData(mName, 'consumerSecret');

    if(!url || !consumerKey || !consumerSecret) {
        global.robot.bot.sendMessage(userid, fn.mstr[mName].mess['neddOption']);
        return;
    }

    WooCommerceOption.url = url.value;
    WooCommerceOption.consumerKey = consumerKey.value;
    WooCommerceOption.consumerSecret = consumerSecret.value;

    var WooCommerce = new WooCommerceAPI(WooCommerceOption);
    return WooCommerce;
}

var parametersToString = function(parameters){
    const queryString = require('query-string');
    var query = '?' + queryString.stringify(parameters);
    // var parametersArr = Object.keys(parameters);
    // parametersArr.forEach((key, i) => {
    //     queryString += key + '=' + parameters[key];
    //     if(i < parametersArr.length-1) queryString+= '&';
    // });
    return query;
}

var getFromWoocom = async function(userid, endPoint, parameters)
{
    var tempEndpoint = endPoint;
    if(parameters) tempEndpoint += parametersToString(parameters);

    var WooCommerce = getWooCommerceAPI(userid);
    var result = await WooCommerce.getAsync(tempEndpoint).then();
    var body = JSON.parse(result.body);

    //404 is missing or dosint exist
    if(body.code != 404 && body.message) global.robot.bot.sendMessage(userid, body.message);
    else if(body.errors) global.robot.bot.sendMessage(userid, JSON.stringify(body.errors));
    else return body;
}

var getCategories = async function(userid, paramenters, optionparam)
{
    var option = (optionparam) ? optionparam : {};
    var categories = await getFromWoocom(userid, 'products/categories', paramenters);
    var result = [];
    categories.forEach(cat => 
    {
        //if(cat.parent == parentid) result.push(cat);

        //retrive by parentid
        // var parentKey = (paramenters.parent == null) ? true : false;
        // if(!parentKey && cat.parent == paramenters.parent) 
        //     parentKey = true;

        //retive by catid
        var catidKey = (option.categoryid == null) ? true : false;
        if(!catidKey && cat.id == option.categoryid) 
            catidKey = true;

        //retrive by name
        var keynam = (option.name == null) ? true : false;
        if(!keynam && cat.name == option.name) 
            keynam = true;

        //join to result
        if(catidKey && keynam) result.push(cat);
    });
    
    return result;
}

var getProducts = async function(userid, paramenters, optionparam)
{
    var option = (optionparam) ? optionparam : {};
    var products = await getFromWoocom(userid, 'products', paramenters);

    var result = [];
    products.forEach(product => 
    {
        //scape products which are not subCat
        var cindex = product.categories.length-1;
        var keycat = (paramenters['category']) ? false : true;
        if(product.categories[cindex].id == paramenters['category'])
            keycat = true;

        //retrive by name
        var keynam = (option.name) ? false : true;
        if(!keynam && product.name == option.name) keynam = true;

        //join to result
        if(keycat && keynam) result.push(product);
    });

    return result;
}

var showDirectory = async function(userid, category, optionparam)
{
    var option = (optionparam) ? optionparam : {};

    var catDistnation = null;
    if(option.main) catDistnation = {'name': option.main, 'description':'', 'id':0};
    else catDistnation = category;
    var categoryid = catDistnation.id;

    //get subcats
    var categories = await getCategories(userid, {'parent':categoryid});
    
    //get subproducts
    //main cat is 0, if request is for main cat, products will not be used
    var products = [];
    console.log('categoryid', categoryid);
    if(categoryid !== 0)
        products = await getProducts(userid, {'category': catDistnation.id});

    var list = [];
    categories.forEach(cat => { list.push(cat.name); });
    products.forEach(pro => { list.push(pro.name + ' ' + pro.id); });

    if(list.length == 0)
    {
        global.robot.bot.sendMessage(userid, 'هیچ محصولی در این دسته بندی اضافه نشده است.');
        return;
    }

    var back = fn.mstr['category']['backtoParent'];
    var remarkup = fn.generateKeyboard({'custom':true, 'grid':true, 'list':list, 'back':back}, false);

    var mess = (catDistnation.description.length > 0) ? catDistnation.description : catDistnation.name;
    global.robot.bot.sendMessage(userid, mess, remarkup);
    fn.userOper.setSection(userid, categoryid, true);
}

var showMain = async function(userid, button)
{
    await fn.userOper.setSection(userid, button, true);
    showDirectory(userid, 0, {'main': button});
}

var showProduct = async function(userid, mName, categoryid, text)
{
    var pid = text.split(' ');
    pid = pid[pid.length-1];

    var product = await getFromWoocom (userid, 'products/' + pid);
    if(!product) return;

    //get sale type 
    var saletype = fn.getModuleData('woocommerce', 'saletype');
    if(!saletype) saletype = 'show';

    var detailArr = [];
    if(saletype.value == 'show') 
    {
        var linkbtn = [{'text': 'نمایش و خرید در سایت', 'url': product.permalink}];
        detailArr.push(linkbtn);
    }

    else if(saletype.value == 'sale') 
    {
        var qt = fn.mstr[mName].query;
        var fx_buy = qt[mName] + '-' + qt['user'] + '-' + qt['salemode'] + '-' + qt['buy'] + '-' + product.id;
        var buy = [{'text': 'خرید', 'callback_data': fx_buy}];
        detailArr.push(buy);
    }

    //mess
    var mess = getProductDetail(product, {'image':true});

    //send
    var op = {"reply_markup" : {"inline_keyboard" : detailArr}};
    global.robot.bot.sendMessage(userid, mess, op);
}

var getProductDetail = function(product, optionparams)
{
    var option = (optionparams) ? optionparams : {};
    var striptags = require('striptags');

    //get currentcy
    var currencyData = fn.getModuleData('woocommerce', 'currency');
    var currency = (currencyData.value) ? currencyData.value : 'تومان';

    //atrrs
    var atrrsDetail = '';
    product.attributes.forEach(atrr => {
        atrrsDetail = '✴️ ' + atrr.name + ': ' + atrr.options + '\n';
    });

    //mess
    var title = '☸️ ' + striptags(product.title);
    var id = '🆔 ' + product.id;
    var description = '🔶 ' + striptags(product.short_description);
    var mess = title;
    mess += '\n' + description.trim();
    mess += '\n' + atrrsDetail;
    mess += '💵 قیمت: ' + product.price + ' ' + currency;
    mess += '\n' + id;
    //image
    if(option.image && product.images.length > 0) mess += '\n\n' + product.images[0].src;

    return mess;
}

var routting = async function(message, speratedSection, user, mName)
{
    var text = message.text;
    var last = speratedSection.length-1;
    var userid = message.from.id;
    var button = fn.getModuleData(mName, 'menuItem').value;
    var back = fn.mstr['category']['backtoParent'];

    //show main
    if (message.text === button) showMain(userid, button);

    //back
    else if(text == back)
    {
        console.log('back to upcat woo')
        //backup to botcat
        if(speratedSection[last-1] == button)
        {
            var splicedSection = speratedSection.splice(last-1, 1);
            fn.menu.backtoParent(message, splicedSection, user);
            return;
        }

        //back up to parent Woocat
        var upid = (speratedSection[last-1] == button) ? 0 : parseInt(speratedSection[last-1]);
        var op = (upid == 0) ? {'main': button} : {};
        
        var upcat = {};
        if(upid !== 0) upcat = await getFromWoocom (userid, 'products/categories/' + upid);
        
        showDirectory(userid, upcat, op);
    }

    //choose
    else
    {
        console.log('choose item woo')
        var parentid = (speratedSection[last] == button) ? 0 : parseInt(speratedSection[last]);
        var categories = await getCategories(userid, {'parent':parentid}, {'name': text});

        if(categories.length > 0) showDirectory(userid, categories[0]);
        else showProduct(userid, mName, parentid, text);
    }
}

var salemode = require('./salemode');

module.exports = { 
    routting, checkRoute, 
    salemode, getProductDetail,
    getFromWoocom, getCategories, getProducts
 }