/*
 SHIVSAGAR KRUSHI SEVA KENDRA & HARDWARE
 Google Sheets + Google Apps Script Backend V2
 ------------------------------------------------
 1. Put your Google Sheet ID into SS_ID.
 2. Run setupDatabase().
 3. Run createInitialOwner().
 4. Deploy as Web App.
 5. Frontend calls POST /exec with:
    {action:"login", payload:{username:"...",password:"..."}}
    {action:"list", token:"...", payload:{entity:"Products"}}
*/

const SS_ID = '13NhXw_X7-4ua9UdwjxyEmN6yanXZukMLeBhbvMKTqq0';
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

const SCHEMAS = {"Users":["id","name","username","password","role","branchId","active","createdAt","updatedAt"],"Branches":["id","name","code","address","phone","gstin","active","createdAt","updatedAt"],"Products":["id","sku","barcode","name","category","unit","hsn","gstRate","purchasePrice","sellingPrice","mrp","stock","reorderLevel","batch","expiry","supplierId","branchId","active","createdAt","updatedAt"],"Customers":["id","name","phone","whatsapp","email","address","gstin","openingBalance","creditLimit","branchId","active","createdAt","updatedAt"],"Suppliers":["id","name","phone","email","address","gstin","openingBalance","creditLimit","branchId","active","createdAt","updatedAt"],"Sales":["id","invoiceNo","date","customerId","branchId","subtotal","discount","taxableAmount","gstAmount","total","paymentMode","paidAmount","creditAmount","status","notes","createdBy","createdAt"],"SaleItems":["id","saleId","productId","sku","productName","qty","unitPrice","discount","gstRate","gstAmount","lineTotal","batch","expiry","createdAt"],"Purchases":["id","grnNo","invoiceNo","date","supplierId","branchId","subtotal","discount","taxableAmount","gstAmount","total","paidAmount","creditAmount","status","notes","createdBy","createdAt"],"PurchaseItems":["id","purchaseId","productId","sku","productName","qty","unitCost","discount","gstRate","gstAmount","lineTotal","batch","expiry","createdAt"],"SalesReturns":["id","returnNo","date","saleId","invoiceNo","customerId","branchId","subtotal","gstAmount","total","refundMode","reason","createdBy","createdAt"],"PurchaseReturns":["id","returnNo","date","purchaseId","grnNo","supplierId","branchId","subtotal","gstAmount","total","adjustmentMode","reason","createdBy","createdAt"],"SalesReturnItems":["id","returnId","productId","sku","productName","qty","unitPrice","gstRate","gstAmount","lineTotal","batch","expiry","createdAt"],"PurchaseReturnItems":["id","returnId","productId","sku","productName","qty","unitCost","gstRate","gstAmount","lineTotal","batch","expiry","createdAt"],"Payments":["id","date","type","partyId","partyName","referenceType","referenceId","invoiceNo","branchId","amount","paymentMode","referenceNo","notes","createdBy","createdAt"],"StockAdjustments":["id","date","productId","sku","productName","branchId","type","qty","reason","reference","batch","expiry","createdBy","createdAt"],"Expenses":["id","date","category","description","amount","gstAmount","paymentMode","branchId","referenceNo","createdBy","createdAt"],"Settings":["key","value"],"AuditLog":["id","timestamp","userId","username","action","entity","entityId","details","branchId"],"SiteContent":["id","section","title","subtitle","content","imageUrl","buttonText","buttonUrl","active","sortOrder"],"HeroSlides":["id","title","subtitle","description","imageUrl","buttonText","buttonUrl","active","sortOrder"],"SiteImages":["id","name","imageUrl","altText","section","active","sortOrder"],"SiteProducts":["id","name","shortDescription","description","imageUrl","priceText","category","active","sortOrder"],"SiteServices":["id","name","description","icon","imageUrl","active","sortOrder"],"BusinessInfo":["id","businessName","tagline","logoUrl","phone","whatsapp","email","address","gstin","hours","about","facebook","instagram","youtube","active"],"NavLinks":["id","label","url","target","active","sortOrder"],"ContactInfo":["id","label","value","type","active","sortOrder"]};
const ENTITY_ALIASES = {
  product:'Products', products:'Products',
  customer:'Customers', customers:'Customers',
  supplier:'Suppliers', suppliers:'Suppliers',
  sale:'Sales', sales:'Sales',
  saleitem:'SaleItems', saleitems:'SaleItems',
  purchase:'Purchases', purchases:'Purchases',
  purchaseitem:'PurchaseItems', purchaseitems:'PurchaseItems',
  salesreturn:'SalesReturns', salesreturns:'SalesReturns',
  purchasereturn:'PurchaseReturns', purchasereturns:'PurchaseReturns',
  salesreturnitem:'SalesReturnItems', salesreturnitems:'SalesReturnItems',
  purchasereturnitem:'PurchaseReturnItems', purchasereturnitems:'PurchaseReturnItems',
  payment:'Payments', payments:'Payments',
  expense:'Expenses', expenses:'Expenses',
  stockadjustment:'StockAdjustments', stockadjustments:'StockAdjustments',
  stock:'StockAdjustments',
  user:'Users', users:'Users',
  branch:'Branches', branches:'Branches',
  setting:'Settings', settings:'Settings',
  audit:'AuditLog', auditlog:'AuditLog',
  sitecontent:'SiteContent',
  heroslide:'HeroSlides', heroslides:'HeroSlides',
  siteimage:'SiteImages', siteimages:'SiteImages',
  siteproduct:'SiteProducts', siteproducts:'SiteProducts',
  siteservice:'SiteServices', siteservices:'SiteServices',
  businessinfo:'BusinessInfo',
  navlink:'NavLinks', navlinks:'NavLinks',
  contactinfo:'ContactInfo'
};

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.action === 'publicCMS') {
      return out(publicCMS());
    }
    return out({
      ok:true,
      service:'Shivsagar Krushi Seva Kendra & Hardware API',
      version:'2.0',
      timestamp:new Date().toISOString()
    });
  } catch (err) {
    return out({ok:false,message:err.message});
  }
}

function doPost(e) {
  try {
    var body = e && e.postData && e.postData.contents
      ? JSON.parse(e.postData.contents)
      : {};
    return out(route(body));
  } catch (err) {
    return out({ok:false,message:err.message,stack:err.stack});
  }
}

function route(req) {
  req = req || {};
  var action = String(req.action || '').trim();
  var p = req.payload || {};

  switch (action) {
    case 'setup': return setupDatabase();
    case 'login': return login(p);
    case 'logout': return logout(req);
    case 'me': return me(req);

    case 'list': return list(req);
    case 'get': return getOne(req);
    case 'create': return create(req);
    case 'update': return update(req);
    case 'delete': return deleteRecord(req);

    case 'dashboard': return dashboard(req);
    case 'publicCMS': return publicCMS();
    case 'ledger': return ledger(req);
    case 'dayEnd': return dayEnd(req);
    case 'stockSummary': return stockSummary(req);
    case 'toggleModule': return toggleModule(req);

    default:
      throw new Error('Unknown action: ' + action);
  }
}

/* ---------- DATABASE ---------- */

function db() {
  if (SS_ID === 'YOUR_SPREADSHEET_ID') {
    throw new Error('Set SS_ID in Code.gs before using the API.');
  }
  return SpreadsheetApp.openById(SS_ID);
}

function setupDatabase() {
  var ss = db();

  Object.keys(SCHEMAS).forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SCHEMAS[name]);
      sheet.setFrozenRows(1);
    } else {
      var headers = getHeaders_(sheet);
      if (headers.length === 0) sheet.appendRow(SCHEMAS[name]);
    }
  });

  seedCMS_(ss);

  return {
    ok:true,
    message:'Database initialized successfully.',
    sheets:Object.keys(SCHEMAS)
  };
}

function seedCMS_(ss) {
  var business = ss.getSheetByName('BusinessInfo');
  if (business && business.getLastRow() === 1) {
    business.appendRow([
      'BUSINESS-001',
      'Shivsagar Krushi Seva Kendra & Hardware',
      'Agriculture, Hardware & Farm Solutions',
      '', '', '', '', '', '', '', '',
      '', '', '', 'true'
    ]);
  }

  var hero = ss.getSheetByName('HeroSlides');
  if (hero && hero.getLastRow() === 1) {
    hero.appendRow([
      'HERO-001',
      'Welcome to Shivsagar Krushi Seva Kendra & Hardware',
      'Quality products for farmers and businesses',
      'Manage your website directly from the Admin Portal.',
      '', 'Explore', '#', 'true', 1
    ]);
  }

  var content = ss.getSheetByName('SiteContent');
  if (content && content.getLastRow() === 1) {
    content.appendRow([
      'HOME-001',
      'home',
      'Welcome to Shivsagar Krushi Seva Kendra & Hardware',
      '',
      'Agricultural, hardware and farm solution products.',
      '', '', '', 'true', 1
    ]);
  }
}

function getHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() === 0) return [];
  return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]
    .map(function(x){ return String(x).trim(); });
}

function read(entity) {
  entity = entityName(entity);
  if (entity === '__dashboard') return [];

  var sheet = db().getSheetByName(entity);
  if (!sheet) throw new Error('Sheet not found: ' + entity);

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  var headers = values[0].map(String);

  return values.slice(1).map(function(row) {
    var obj = {};
    headers.forEach(function(h,i) {
      obj[h] = normalizeValue_(row[i]);
    });
    return obj;
  });
}

function append(entity, record) {
  entity = entityName(entity);
  var sheet = db().getSheetByName(entity);
  if (!sheet) throw new Error('Sheet not found: ' + entity);

  var headers = getHeaders_(sheet);
  sheet.appendRow(headers.map(function(h) {
    return record[h] !== undefined ? record[h] : '';
  }));
}

function replaceRow_(entity, id, record) {
  entity = entityName(entity);
  var sheet = db().getSheetByName(entity);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];

  var idCol = headers.indexOf('id');
  if (idCol < 0) throw new Error('Entity has no id field: ' + entity);

  for (var r=1; r<values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      sheet.getRange(r+1,1,1,headers.length).setValues([
        headers.map(function(h){
          return record[h] !== undefined ? record[h] : '';
        })
      ]);
      return true;
    }
  }

  return false;
}

function removeRow_(entity,id) {
  entity = entityName(entity);
  var sheet = db().getSheetByName(entity);
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');

  if (idCol < 0) throw new Error('Entity has no id field: ' + entity);

  for (var r=1; r<values.length; r++) {
    if (String(values[r][idCol]) === String(id)) {
      sheet.deleteRow(r+1);
      return true;
    }
  }

  return false;
}

/* ---------- ENTITY RESOLUTION ---------- */

function entityName(input) {
  var n = input;

  if (n && typeof n === 'object') {
    n = n.entity || n.entityName || n.name;
  }

  if (n === undefined || n === null || String(n).trim() === '') {
    throw new Error(
      'Entity is required. Example: {entity:"Products"}'
    );
  }

  n = String(n).trim();

  if (SCHEMAS[n]) return n;

  var key = n.toLowerCase()
    .replace(/[\s_-]/g,'');

  if (ENTITY_ALIASES[key]) return ENTITY_ALIASES[key];

  if (key === 'dashboard') return '__dashboard';

  throw new Error(
    'Invalid entity: ' + n +
    '. Valid entities: ' +
    Object.keys(SCHEMAS).join(', ')
  );
}

/* ---------- AUTH ---------- */

function createInitialOwner() {
  var sheet = db().getSheetByName('Users');

  if (sheet.getLastRow() > 1) {
    return {ok:true,message:'Users already exist. No owner created.'};
  }

  sheet.appendRow([
    Utilities.getUuid(),
    'Owner',
    'admin',
    hashPassword_('admin123'),
    'Administrator',
    '',
    true,
    new Date().toISOString(),
    new Date().toISOString()
  ]);

  return {
    ok:true,
    message:'Owner created.',
    username:'admin',
    temporaryPassword:'admin123'
  };
}

function login(p) {
  p = p || {};

  var username = String(p.username || '').trim();
  var password = String(p.password || '');

  if (!username || !password) {
    throw new Error('Username and password are required.');
  }

  var users = read('Users');

  var user = users.find(function(u) {
    if (String(u.username) !== username) return false;
    if (String(u.active).toLowerCase() === 'false') return false;

    return String(u.passwordHash || '') === hashPassword_(password) ||
           String(u.password || '') === password;
  });

  if (!user) throw new Error('Invalid username or password.');

  var token = Utilities.getUuid() + '.' + Utilities.getUuid();

  var session = {
    token:token,
    userId:user.id,
    username:user.username,
    name:user.name,
    role:user.role,
    branchId:user.branchId || '',
    expiresAt:Date.now() + TOKEN_TTL_MS
  };

  PropertiesService.getScriptProperties()
    .setProperty('SESSION_' + token, JSON.stringify(session));

  return {
    ok:true,
    token:token,
    user:{
      id:user.id,
      username:user.username,
      name:user.name,
      role:user.role,
      branchId:user.branchId || ''
    }
  };
}

function auth_(token) {
  if (!token) throw new Error('Authentication token required.');

  var raw = PropertiesService.getScriptProperties()
    .getProperty('SESSION_' + token);

  if (!raw) throw new Error('Invalid or expired session.');

  var session = JSON.parse(raw);

  if (Date.now() > Number(session.expiresAt)) {
    PropertiesService.getScriptProperties()
      .deleteProperty('SESSION_' + token);
    throw new Error('Session expired. Please login again.');
  }

  return session;
}

function logout(req) {
  if (req && req.token) {
    PropertiesService.getScriptProperties()
      .deleteProperty('SESSION_' + req.token);
  }

  return {ok:true,message:'Logged out.'};
}

function me(req) {
  var u = auth_(req.token);
  return {ok:true,user:u};
}

function hashPassword_(password) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );

  return bytes.map(function(b) {
    var v = b < 0 ? b + 256 : b;
    return ('0' + v.toString(16)).slice(-2);
  }).join('');
}

/* ---------- AUTHORIZED CRUD ---------- */

function list(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var entity = entityName(p.entity || p.entityName);

  if (entity === '__dashboard') return dashboard(req);

  authorize_(u,entity,'READ');

  var rows = read(entity);

  if (u.branchId && hasField_(entity,'branchId')) {
    rows = rows.filter(function(r) {
      return !r.branchId || String(r.branchId) === String(u.branchId);
    });
  }

  return {ok:true,rows:rows};
}

function getOne(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var entity = entityName(p.entity || p.entityName);

  authorize_(u,entity,'READ');

  var rows = read(entity);
  var id = p.id || p.recordId;

  var row = rows.find(function(r) {
    return String(r.id) === String(id);
  });

  if (!row) throw new Error('Record not found.');

  return {ok:true,row:row};
}

function create(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var entity = entityName(p.entity || p.entityName);

  if (entity === '__dashboard') {
    throw new Error('Dashboard is read-only.');
  }

  authorize_(u,entity,'CREATE');

  var data = p.data || {};
  var record = {};

  SCHEMAS[entity].forEach(function(field) {
    record[field] = data[field] !== undefined ? data[field] : '';
  });

  if (hasField_(entity,'id')) {
    record.id = data.id || Utilities.getUuid();
  }

  if (hasField_(entity,'createdAt')) {
    record.createdAt = data.createdAt || new Date().toISOString();
  }

  if (hasField_(entity,'updatedAt')) {
    record.updatedAt = new Date().toISOString();
  }

  if (hasField_(entity,'createdBy')) {
    record.createdBy = u.username;
  }

  if (hasField_(entity,'branchId') && !record.branchId) {
    record.branchId = u.branchId || '';
  }

  append(entity,record);

  audit_(
    u,
    'CREATE',
    entity,
    record.id || '',
    record
  );

  return {ok:true,row:record};
}

function update(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var entity = entityName(p.entity || p.entityName);

  authorize_(u,entity,'UPDATE');

  var id = p.id || p.recordId;
  if (!id) throw new Error('Record id is required.');

  var rows = read(entity);
  var old = rows.find(function(r) {
    return String(r.id) === String(id);
  });

  if (!old) throw new Error('Record not found.');

  if (u.branchId && old.branchId &&
      String(old.branchId) !== String(u.branchId)) {
    throw new Error('Access denied for this branch.');
  }

  var data = p.data || {};
  var record = {};

  SCHEMAS[entity].forEach(function(field) {
    if (data[field] !== undefined) {
      record[field] = data[field];
    } else {
      record[field] = old[field] !== undefined ? old[field] : '';
    }
  });

  if (hasField_(entity,'updatedAt')) {
    record.updatedAt = new Date().toISOString();
  }

  if (replaceRow_(entity,id,record) === false) {
    throw new Error('Unable to update record.');
  }

  audit_(u,'UPDATE',entity,id,{
    before:old,
    after:record
  });

  return {ok:true,row:record};
}

function deleteRecord(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var entity = entityName(p.entity || p.entityName);

  authorize_(u,entity,'DELETE');

  var id = p.id || p.recordId;
  if (!id) throw new Error('Record id is required.');

  var rows = read(entity);
  var old = rows.find(function(r) {
    return String(r.id) === String(id);
  });

  if (!old) throw new Error('Record not found.');

  if (u.branchId && old.branchId &&
      String(old.branchId) !== String(u.branchId)) {
    throw new Error('Access denied for this branch.');
  }

  if (!removeRow_(entity,id)) {
    throw new Error('Unable to delete record.');
  }

  audit_(u,'DELETE',entity,id,old);

  return {ok:true,message:'Record deleted successfully.'};
}

/* ---------- PERMISSIONS ---------- */

function authorize_(u,entity,operation) {
  var role = String(u.role || '').toLowerCase();

  if (role === 'administrator' ||
      role === 'admin' ||
      role === 'owner') {
    return true;
  }

  var readOnly = [
    'dashboard','Products','Customers','Suppliers',
    'Sales','Purchases','Payments','Expenses',
    'SiteContent','HeroSlides','SiteImages',
    'SiteProducts','SiteServices','BusinessInfo',
    'NavLinks','ContactInfo'
  ];

  if (operation === 'READ' && readOnly.indexOf(entity) >= 0) {
    return true;
  }

  throw new Error(
    'Permission denied: ' + operation + ' on ' + entity
  );
}

function hasField_(entity,field) {
  return SCHEMAS[entity] &&
    SCHEMAS[entity].indexOf(field) >= 0;
}

/* ---------- DASHBOARD ---------- */

function dashboard(req) {
  var u = auth_(req.token);

  return {
    ok:true,
    summary:{
      products:read('Products').length,
      customers:read('Customers').length,
      suppliers:read('Suppliers').length,
      sales:read('Sales').length,
      purchases:read('Purchases').length,
      payments:read('Payments').length,
      expenses:read('Expenses').length,
      lowStock:read('Products').filter(function(p) {
        var stock = Number(p.stock || 0);
        var reorder = Number(p.reorderLevel || 0);
        return stock <= reorder;
      }).length
    }
  };
}

/* ---------- WEBSITE CMS ---------- */

function publicCMS() {
  var result = {ok:true};

  result.siteContent = read('SiteContent')
    .filter(activeRow_)
    .sort(sortOrder_);

  result.heroSlides = read('HeroSlides')
    .filter(activeRow_)
    .sort(sortOrder_);

  result.siteImages = read('SiteImages')
    .filter(activeRow_)
    .sort(sortOrder_);

  result.siteProducts = read('SiteProducts')
    .filter(activeRow_)
    .sort(sortOrder_);

  result.siteServices = read('SiteServices')
    .filter(activeRow_)
    .sort(sortOrder_);

  result.businessInfo = read('BusinessInfo')
    .filter(activeRow_);

  result.navLinks = read('NavLinks')
    .filter(activeRow_)
    .sort(sortOrder_);

  result.contactInfo = read('ContactInfo')
    .filter(activeRow_)
    .sort(sortOrder_);

  return result;
}

function activeRow_(row) {
  return String(row.active).toLowerCase() !== 'false';
}

function sortOrder_(a,b) {
  return Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
}

/* ---------- LEDGER ---------- */

function ledger(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var partyId = p.partyId;
  var partyType = String(p.partyType || 'customer').toLowerCase();

  if (!partyId) throw new Error('partyId is required.');

  var rows = [];
  var balance = 0;

  if (partyType === 'customer') {
    read('Customers').forEach(function(c) {
      if (String(c.id) === String(partyId)) {
        balance = Number(c.openingBalance || 0);
      }
    });

    read('Sales').forEach(function(s) {
      if (String(s.customerId) === String(partyId)) {
        rows.push({
          date:s.date,
          reference:s.invoiceNo,
          debit:Number(s.total || 0),
          credit:0,
          type:'Sale'
        });
      }
    });

    read('Payments').forEach(function(x) {
      if (String(x.partyId) === String(partyId)) {
        rows.push({
          date:x.date,
          reference:x.referenceNo || x.referenceId,
          debit:0,
          credit:Number(x.amount || 0),
          type:'Payment'
        });
      }
    });
  } else {
    read('Suppliers').forEach(function(s) {
      if (String(s.id) === String(partyId)) {
        balance = Number(s.openingBalance || 0);
      }
    });

    read('Purchases').forEach(function(pur) {
      if (String(pur.supplierId) === String(partyId)) {
        rows.push({
          date:pur.date,
          reference:pur.grnNo,
          debit:Number(pur.total || 0),
          credit:0,
          type:'Purchase'
        });
      }
    });

    read('Payments').forEach(function(x) {
      if (String(x.partyId) === String(partyId)) {
        rows.push({
          date:x.date,
          reference:x.referenceNo || x.referenceId,
          debit:0,
          credit:Number(x.amount || 0),
          type:'Payment'
        });
      }
    });
  }

  rows.sort(function(a,b) {
    return String(a.date).localeCompare(String(b.date));
  });

  rows.forEach(function(r) {
    balance += Number(r.debit || 0) - Number(r.credit || 0);
    r.balance = balance;
  });

  return {ok:true,rows:rows,closingBalance:balance};
}

/* ---------- DAY END ---------- */

function dayEnd(req) {
  var u = auth_(req.token);
  var p = req.payload || {};
  var date = p.date || Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyy-MM-dd'
  );

  function byDate(entity) {
    return read(entity).filter(function(r) {
      return String(r.date || '').slice(0,10) === date;
    });
  }

  var sales = byDate('Sales');
  var purchases = byDate('Purchases');
  var payments = byDate('Payments');
  var expenses = byDate('Expenses');

  var summary = {
    date:date,
    salesCount:sales.length,
    salesTotal:sum_(sales,'total'),
    purchasesTotal:sum_(purchases,'total'),
    receipts:sum_(payments,'amount'),
    expenses:sum_(expenses,'amount')
  };

  summary.closingCash =
    summary.receipts - summary.expenses;

  audit_(
    u,
    'DAY_END',
    'DayEnd',
    date,
    summary
  );

  return {ok:true,summary:summary};
}

/* ---------- STOCK ---------- */

function stockSummary(req) {
  var u = auth_(req.token);
  var products = read('Products');

  var adjustments = read('StockAdjustments');

  return {
    ok:true,
    rows:products.map(function(p) {
      var qty = Number(p.stock || 0);

      adjustments.forEach(function(a) {
        if (String(a.productId) === String(p.id)) {
          var n = Number(a.qty || 0);
          if (String(a.type).toLowerCase() === 'out') {
            qty -= n;
          } else {
            qty += n;
          }
        }
      });

      return {
        id:p.id,
        sku:p.sku,
        name:p.name,
        stock:qty,
        reorderLevel:Number(p.reorderLevel || 0),
        lowStock:qty <= Number(p.reorderLevel || 0)
      };
    })
  };
}

/* ---------- SETTINGS / MODULE TOGGLES ---------- */

function toggleModule(req) {
  var u = auth_(req.token);

  if (String(u.role).toLowerCase() !== 'owner' &&
      String(u.role).toLowerCase() !== 'administrator' &&
      String(u.role).toLowerCase() !== 'admin') {
    throw new Error('Only owner/admin can change module settings.');
  }

  var p = req.payload || {};
  var moduleName = String(p.module || p.key || '').trim();

  if (!moduleName) throw new Error('Module name is required.');

  var value = p.enabled === true || String(p.enabled).toLowerCase() === 'true';

  var settings = read('Settings');
  var existing = settings.find(function(s) {
    return String(s.key) === 'MODULE_' + moduleName;
  });

  var record = {
    key:'MODULE_' + moduleName,
    value:String(value)
  };

  if (existing) {
    replaceRow_('Settings',existing.key,record);
  } else {
    append('Settings',record);
  }

  audit_(
    u,
    'MODULE_TOGGLE',
    'Settings',
    moduleName,
    {enabled:value}
  );

  return {
    ok:true,
    module:moduleName,
    enabled:value
  };
}

/* ---------- AUDIT ---------- */

function audit_(u,action,entity,entityId,details) {
  try {
    var sheet = db().getSheetByName('AuditLog');

    sheet.appendRow([
      Utilities.getUuid(),
      new Date().toISOString(),
      u && u.userId ? u.userId : '',
      u && u.username ? u.username : '',
      action,
      entity,
      entityId,
      JSON.stringify(details || {}),
      u && u.branchId ? u.branchId : ''
    ]);
  } catch (err) {
    console.error('Audit error: ' + err.message);
  }
}

/* ---------- HELPERS ---------- */

function sum_(rows,field) {
  return rows.reduce(function(total,row) {
    return total + Number(row[field] || 0);
  },0);
}

function normalizeValue_(v) {
  if (v instanceof Date) {
    return v.toISOString();
  }
  return v;
}

function out(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
