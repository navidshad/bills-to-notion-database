var getwooSubmiter = async function(userid, productid)
{
    var wooSubmiter = await fn.db.wooSubmiter.findOne({'userid':userid}).exec().then();
    if(!wooSubmiter) wooSubmiter = await new fn.db.wooSubmiter({'userid':userid}).save().then();

    if(wooSubmiter.productid !== parseInt(productid))
    {
        wooSubmiter.productid = productid;
        wooSubmiter.attributes = [];
        await wooSubmiter.save().then();
    }

    return wooSubmiter;
}

var addRemoveAttr = async function(userid, mName, productid, attrindex, optionindex)
{
    var product = await fn.m.woocommerce.user.getFromWoocom(userid, 'products/' + productid);
    product = product.product;
    if(!product) return;

    //get wooSubmiter
    var wooSubmiter = await getwooSubmiter(userid, productid);

    var attribute = product.attributes[attrindex];
    var option = attribute.options[optionindex];

    var waIndex = null;
    var added = false;
    wooSubmiter.attributes.forEach((element, i) => 
    {
        if(element.name !== attribute.name && element.value !== option) return;
        waIndex = i;
        added = true;
    });

    //add
    if(!added) 
    {
        //clear all same type
        var newAttributes = [];
        wooSubmiter.attributes.map(item => {
            if(item.name !== attribute.name) newAttributes.push(item);
        });

        //add one
        newAttributes.push({'name': attribute.name, 'value': option});
        wooSubmiter.attributes = newAttributes;
    }
    //remove
    else if(waIndex !== null) wooSubmiter.attributes.splice(waIndex, 1);

    await wooSubmiter.save().then();
    showAttributes(userid, mName, productid, {'view': 'options', 'attrindex': attrindex});
}

var checkAttrOption = function(wooSubmiter, option)
{
    var key = false;
    wooSubmiter.attributes.forEach(element => {
        if(element.name === option.name && element.value === option.value)
            key = true;
    });
    return key;
}

var getView_main = function(mName, product)
{
    var detailArr = [];
    var qt = fn.mstr[mName].query;
    product.attributes.forEach((attr, i) => {
        var fx_attr = qt[mName] + '-' + qt['user'] + '-' + qt['salemode'] + '-' + qt['attribute'] + '-' + i + '-' + product.id;
        var attrBtn = [{'text': 'انتخاب ' + attr.name, 'callback_data': fx_attr}];
        detailArr.push(attrBtn);
    });

    //submit
    var fx_submit = qt[mName] + '-' + qt['user'] + '-' + qt['salemode'] + '-' + qt['addtobag'] + '-' + product.id;
    var submit = [{'text': '🛍✅ ' + 'ثبت و خرید', 'callback_data': fx_submit}];
    detailArr.push(submit);

    return detailArr;
}

var getView_attribute = function(mName, product, wooSubmiter, attrindex)
{
    var detailArr = [];
    var qt = fn.mstr[mName].query;
    //back btn
    var fx_back = qt[mName] + '-' + qt['user'] + '-' + qt['salemode'] + '-' + qt['buy'] + '-' + product.id;
    var backBtn = [{'text': '🔙' + 'برگشت به ویژگی ها', 'callback_data': fx_back}];
    detailArr.push(backBtn);

    //attr options
    var attribute = product.attributes[attrindex];
    attribute.options.forEach((op, i) => 
    {
        var added = checkAttrOption(wooSubmiter, {'name':attribute.name, 'value': op});
        var fx_op = qt[mName] + '-' + qt['user'] + '-' + qt['salemode'] + '-' + qt['attributeOption'] + '-' + attrindex + '-' + i + '-' + product.id;
        var tx_op = (added) ? '✅ ' + op : op;
        var opBtn = [{'text': tx_op, 'callback_data': fx_op}];
        detailArr.push(opBtn);
    });

    return detailArr;
}

var showAttributes = async function(userid, mName, productid, optionparams)
{
    var option = (optionparams) ? optionparams : {};
    var product = await fn.m.woocommerce.user.getFromWoocom(userid, 'products/' + productid);
    product = product.product;
    if(!product) return;

    //get wooSubmiter
    var wooSubmiter = await getwooSubmiter(userid, productid);

    //get sale type 
    var saletype = fn.getModuleData('woocommerce', 'saletype');
    if(!saletype.value) saletype = 'show';

    var detailArr = [];
    if(option.view == 'options') 
         detailArr = getView_attribute(mName, product, wooSubmiter, option.attrindex);
    else detailArr = getView_main(mName, product);

    //user attr
    userattributes = '';
    wooSubmiter.attributes.forEach(element => {
        userattributes += '✅ ' + element.name + ': ' + element.value + '\n';
    });

    //mess
    var mess = fn.m.woocommerce.user.getProductDetail(product);
    mess += '\n\n' + fn.mstr[mName].mess['selectattr'];
    mess += '\n\n' + '✴️ ' + 'ویژگی های انتخاب شده شما: \n' + userattributes;
    mess += '\n\n' + '🛍';

    //send
    var op = {"reply_markup" : {"inline_keyboard" : detailArr}};
    global.robot.bot.sendMessage(userid, mess, op);
}

var query = async function(query, speratedQuery, user, mName)
{
    var last = speratedQuery.length-1;
    var queryTag = fn.mstr[mName].query;
    var userid = query.from.id;

    //admin settings
    if(speratedQuery[3] === queryTag['buy'])
        showAttributes(userid, mName, speratedQuery[last]);
    
    //choose attr
    else if(speratedQuery[3] === queryTag['attribute'])
    {
        var attrindex = parseInt(speratedQuery[4]);
        if(!isNaN(attrindex))
        showAttributes(userid, mName, speratedQuery[last], {'view': 'options', 'attrindex': attrindex});
    }

    //choose attr option
    else if (speratedQuery[3] === queryTag['attributeOption'])
    {
        var attrindex = parseInt(speratedQuery[4]);
        var optionindex = parseInt(speratedQuery[4]);
        addRemoveAttr(userid, mName, speratedQuery[last], attrindex, optionindex)
    }

    //add to bagshop
    else if (speratedQuery[3] === queryTag['addtobag'])
    {
        var product = await fn.m.woocommerce.user.getFromWoocom(userid, 'products/' + speratedQuery[last]);
        product = product.product;
        if(!product) return;
        
        //get wooSubmiter
        var wooSubmiter = await getwooSubmiter(userid, product.id);

        var datas = [];
        wooSubmiter.attributes.forEach(element => {
            datas.push({'key':element.name, 'value':element.value});
        });

        var productItem = {
            'name'  :product.title + ' ' + product.id, 
            'id'    :product.id, 
            'price' :product.price, 
            'type'  :mName,
            'data'  :datas,
        }
        fn.m.bag.user.bag.additem(userid, productItem, {'showbag':true});
    }

}

module.exports = {
    query, showAttributes,
}