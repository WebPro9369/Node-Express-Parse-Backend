var Cookie = function(options){
  this.path = "/";
  this.maxAge = null;
  this.httpOnly = true;
  //if (options) _.merge(this, options);
}

var encode = encodeURIComponent;
var decode = decodeURIComponent;


Cookie.prototype.serialize = function(key, val){

  var serialize = function(name, val, opt){
    opt = opt || {};
    var enc = opt.encode || encode;
    var pairs = [name + '=' + enc(val)];

    if (opt.maxAge) pairs.push('Max-Age=' + opt.maxAge);
    if (opt.domain) pairs.push('Domain=' + opt.domain);
    if (opt.path) pairs.push('Path=' + opt.path);
    if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
    if (opt.httpOnly) pairs.push('HttpOnly');
    if (opt.secure) pairs.push('Secure');

    return pairs.join('; ');
};
  return serialize(key, val, this);
}

module.exports = Cookie;