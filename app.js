var app = angular.module('ticketApp', []);

app.factory('TicketStore', ['$window', function($window) {
  var KEY = 'dailyTickets.angularjs.v3';
  var DASH_KEY = 'dailyTickets.dashboardValues.v1';

  function localDateString(date) {
    var d = new Date(date);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function seedTickets() {
    var today = new Date(); today.setHours(0,0,0,0);
    var people = ['Divya','Pathan Munna','Afrana Shaik','Subhani Shaik','Rahaman Khan','Support Team'];
    var categories = ['Dev Support','Development','Testing','To Be Discuss'];
    var statuses = ['New','In Progress','Open','Re Open','Resolved'];
    var titles = ['Patient tab not loading','VPN connection issue','Medication data mismatch','API validation issue','Dashboard count mismatch','EMR navigation issue'];
    var result = [], id = 1001;
    for (var day = 0; day < 8; day++) {
      var d = new Date(today); d.setDate(today.getDate() - day);
      var dateText = localDateString(d);
      var count = day === 0 ? 28 : (18 + ((day * 7) % 15));
      for (var i = 0; i < count; i++) {
        var status = statuses[(i + day) % statuses.length];
        if (day === 0 && i < 11) status = 'Resolved';
        if (day === 0 && i >= 11 && i < 17) status = 'New';
        result.push({ id:'TKT-' + id++, title:titles[i % titles.length], description:'Demo ticket generated for the Daily Tickets dashboard.', category:categories[i % categories.length], status:status, assignee:people[i % people.length], createdDate:dateText, resolvedDate:status === 'Resolved' ? dateText : null });
      }
    }
    return result;
  }

  function loadTickets() {
    try { var raw = $window.localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch(e) {}
    var data = seedTickets(); saveTickets(data); return data;
  }
  function saveTickets(data) { $window.localStorage.setItem(KEY, JSON.stringify(data)); }

  function loadDashboard() {
    try { var raw = $window.localStorage.getItem(DASH_KEY); if (raw) return JSON.parse(raw); } catch(e) {}
    return {};
  }
  function saveDashboard(data) { $window.localStorage.setItem(DASH_KEY, JSON.stringify(data)); }

  return { load:loadTickets, save:saveTickets, clear:function(){ $window.localStorage.removeItem(KEY); }, localDateString:localDateString, loadDashboard:loadDashboard, saveDashboard:saveDashboard, clearDashboard:function(){ $window.localStorage.removeItem(DASH_KEY); } };
}]);

app.controller('TicketController', ['TicketStore', '$window', function(TicketStore, $window) {
  var vm = this;
  vm.activeTab = 'dashboard';
  vm.tickets = TicketStore.load();
  vm.statuses = ['New','In Progress','Open','Re Open','Resolved'];
  vm.pendingStatuses = ['New','In Progress','Open','Re Open'];
  vm.categories = ['Dev Support','Development','Testing','To Be Discuss'];
  vm.search=''; vm.filterStatus=''; vm.filterCategory=''; vm.showModal=false; vm.editing=false; vm.lastAction='';
  vm.selectedDate = new Date(); vm.selectedDate.setHours(0,0,0,0);
  vm.dashboardValues = TicketStore.loadDashboard();
  vm.editWeekly = false;

  function dateKey(date) { var d=new Date(date); d.setHours(0,0,0,0); return TicketStore.localDateString(d); }
  function addDays(date,n) { var d=new Date(date); d.setDate(d.getDate()+n); d.setHours(0,0,0,0); return d; }
  function dateInput(value) { return value ? new Date(value + 'T12:00:00') : null; }
  function normalizeDate(value) { return value ? TicketStore.localDateString(value) : null; }

  vm.buildDays = function() {
    vm.days=[];
    for(var i=7;i>=1;i--){ var d=addDays(vm.selectedDate,-i); vm.days.push({date:d,key:dateKey(d),label:'Day -'+i}); }
    var y=addDays(vm.selectedDate,-1); vm.days.push({date:y,key:dateKey(y),label:'Yesterday'});
  };

  // Dashboard manual-entry model. These are the numbers shown in the table.
  function dashboardRow(key, date) {
    if (!vm.dashboardValues[date]) vm.dashboardValues[date] = {};
    if (typeof vm.dashboardValues[date][key] !== 'number') vm.dashboardValues[date][key] = 0;
    return vm.dashboardValues[date][key];
  }

  vm.ensureDashboardDefaults = function() {
    var allDates = vm.days.map(function(d){return d.key;});
    allDates.push(dateKey(vm.selectedDate));
    allDates.forEach(function(k){
      if(!vm.dashboardValues[k]) vm.dashboardValues[k] = {};
      ['new','resolved','pending','New','In Progress','Open','Re Open'].forEach(function(row){
        if(typeof vm.dashboardValues[k][row] !== 'number') vm.dashboardValues[k][row]=0;
      });
      if(typeof vm.dashboardValues[k].resolvedTotal !== 'number') vm.dashboardValues[k].resolvedTotal=vm.dashboardValues[k].resolved;
    });
  };

  // First load uses the values from the screenshot so the table can be edited directly.
  vm.seedDashboardFromImageIfEmpty = function() {
    if(Object.keys(vm.dashboardValues).length) return;
    var vals = [
      {new:22,resolved:4,pending:18,New:4,'In Progress':4,Open:5,'Re Open':5},
      {new:30,resolved:6,pending:42,New:10,'In Progress':10,Open:11,'Re Open':11},
      {new:23,resolved:4,pending:61,New:15,'In Progress':15,Open:16,'Re Open':15},
      {new:31,resolved:7,pending:85,New:21,'In Progress':21,Open:22,'Re Open':21},
      {new:24,resolved:5,pending:104,New:26,'In Progress':26,Open:26,'Re Open':26},
      {new:32,resolved:6,pending:130,New:32,'In Progress':32,Open:33,'Re Open':33},
      {new:20,resolved:4,pending:146,New:36,'In Progress':36,Open:37,'Re Open':37},
      {new:20,resolved:4,pending:146,New:36,'In Progress':36,Open:37,'Re Open':37},
      {new:28,resolved:13,pending:161,New:44,'In Progress':38,Open:40,'Re Open':39}
    ];
    vm.days.forEach(function(d,i){ vm.dashboardValues[d.key]=angular.copy(vals[i]); vm.dashboardValues[d.key].resolvedTotal=vals[i].resolved; });
    var todayKey=dateKey(vm.selectedDate); vm.dashboardValues[todayKey]=angular.copy(vals[8]); vm.dashboardValues[todayKey].resolvedTotal=13;
    TicketStore.saveDashboard(vm.dashboardValues);
  };

  vm.metric = function(day, metric) {
    if(!day) return 0;
    var k=day.key || dateKey(day.date);
    if(vm.dashboardValues[k] && typeof vm.dashboardValues[k][metric] === 'number') return vm.dashboardValues[k][metric];
    return dashboardRow(metric,k);
  };
  vm.todayValue = function(metric){ return vm.metric({key:dateKey(vm.selectedDate)},metric); };
  vm.setValue = function(key, date, value) {
    if(!vm.dashboardValues[date]) vm.dashboardValues[date]={};
    var n=parseInt(value,10); if(isNaN(n)||n<0)n=0;
    vm.dashboardValues[date][key]=n;
    if(key==='resolved') vm.dashboardValues[date].resolvedTotal=n;
    if(key==='New'||key==='In Progress'||key==='Open'||key==='Re Open') {
      vm.dashboardValues[date].pending = (vm.dashboardValues[date].New||0)+(vm.dashboardValues[date]['In Progress']||0)+(vm.dashboardValues[date].Open||0)+(vm.dashboardValues[date]['Re Open']||0);
    }
    TicketStore.saveDashboard(vm.dashboardValues);
    vm.refreshChanges();
  };

  vm.refreshChanges = function(){
    vm.todayNew=vm.todayValue('new'); vm.todayResolved=vm.todayValue('resolved'); vm.totalPending=vm.todayValue('pending');
    vm.todayObject={key:dateKey(vm.selectedDate),date:vm.selectedDate};
  };
  vm.refresh = function(){ vm.buildDays(); vm.ensureDashboardDefaults(); vm.seedDashboardFromImageIfEmpty(); vm.refreshChanges(); };
  vm.valueFor=function(item,metric){return item ? vm.metric(item,metric):0;};
  vm.change=function(previous,current,metric){return vm.valueFor(current,metric)-vm.valueFor(previous,metric);};
  vm.changeClass=function(v){return v>0?'change-up':(v<0?'change-down':'change-zero');};
  vm.statusCount=function(status){return vm.todayValue(status);};
  vm.barWidth=function(status){var max=0;vm.pendingStatuses.forEach(function(s){max=Math.max(max,vm.statusCount(s));});return max?Math.round(vm.statusCount(status)/max*100):0;};

  vm.changeDay=function(amount){vm.selectedDate=addDays(vm.selectedDate,amount);vm.refresh();};
  vm.goToCrud=function(){vm.activeTab='tickets';};
  vm.clearFilters=function(){vm.search='';vm.filterStatus='';vm.filterCategory='';};
  vm.goToDashboard=function(){vm.activeTab='dashboard';vm.refresh();};
  vm.toggleWeeklyEdit=function(){vm.editWeekly=!vm.editWeekly;};
  vm.saveWeeklyValues=function(){TicketStore.saveDashboard(vm.dashboardValues);vm.editWeekly=false;vm.refreshChanges();vm.lastAction='Weekly dashboard values saved.';};
  vm.resetWeeklyValues=function(){
    if(!$window.confirm('Reset weekly dashboard values to the original sample values?')) return;
    TicketStore.clearDashboard(); vm.dashboardValues={}; vm.buildDays(); vm.seedDashboardFromImageIfEmpty(); vm.ensureDashboardDefaults(); vm.refreshChanges(); vm.editWeekly=false; vm.lastAction='Weekly values reset.';
  };

  vm.ticketsForSelectedDate=function(){var k=dateKey(vm.selectedDate);return vm.tickets.filter(function(t){return t.createdDate===k;}).sort(function(a,b){return String(b.id).localeCompare(String(a.id));});};

  vm.openTicketModal=function(){vm.editing=false;vm.form={title:'',description:'',category:'Development',status:'New',assignee:'',createdDate:new Date(vm.selectedDate),resolvedDate:null};vm.showModal=true;};
  vm.editTicket=function(ticket){vm.editing=true;vm.form=angular.copy(ticket);vm.form.createdDate=dateInput(ticket.createdDate);vm.form.resolvedDate=dateInput(ticket.resolvedDate);vm.showModal=true;};
  vm.closeTicketModal=function(){vm.showModal=false;};
  vm.saveTicket=function(){
    if(!vm.form.title||!vm.form.category||!vm.form.status||!vm.form.createdDate)return;
    var item=angular.copy(vm.form);item.createdDate=normalizeDate(item.createdDate);item.resolvedDate=item.status==='Resolved'?normalizeDate(item.resolvedDate||item.createdDate):null;
    if(vm.editing){for(var i=0;i<vm.tickets.length;i++){if(vm.tickets[i].id===item.id){vm.tickets[i]=item;break;}}vm.lastAction='Ticket updated: '+item.id;}
    else{item.id='TKT-'+Date.now();vm.tickets.push(item);vm.lastAction='Ticket created: '+item.id;}
    TicketStore.save(vm.tickets);vm.showModal=false;vm.refresh();
  };
  vm.deleteTicket=function(ticket){if(!$window.confirm('Delete '+ticket.id+'? This cannot be undone.'))return;vm.tickets=vm.tickets.filter(function(t){return t.id!==ticket.id;});TicketStore.save(vm.tickets);vm.lastAction='Ticket deleted: '+ticket.id;vm.refresh();};
  vm.statusClass=function(status){return {'New':'badge-new','In Progress':'badge-progress','Open':'badge-open','Re Open':'badge-reopen','Resolved':'badge-resolved'}[status]||'';};
  vm.statusFilter=function(ticket){return !vm.filterStatus||ticket.status===vm.filterStatus;};
  vm.categoryFilter=function(ticket){return !vm.filterCategory||ticket.category===vm.filterCategory;};

  vm.exportData=function(){var payload={tickets:vm.tickets,dashboardValues:vm.dashboardValues};var blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});var url=$window.URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='daily-tickets-backup.json';document.body.appendChild(a);a.click();document.body.removeChild(a);$window.URL.revokeObjectURL(url);};
  vm.importData=function(file){if(!file)return;var reader=new FileReader();reader.onload=function(e){try{var data=JSON.parse(e.target.result);if(Array.isArray(data)){vm.tickets=data;}else{vm.tickets=data.tickets||[];vm.dashboardValues=data.dashboardValues||{};}TicketStore.save(vm.tickets);TicketStore.saveDashboard(vm.dashboardValues);vm.refresh();vm.lastAction='JSON import completed.';alert('Import completed successfully.');}catch(err){alert('Invalid JSON file.');}};reader.readAsText(file);};
  vm.resetDemoData=function(){if(!$window.confirm('Reset tickets to the original demo data?'))return;TicketStore.clear();vm.tickets=TicketStore.load();vm.refresh();vm.lastAction='Demo ticket data reset.';};

  vm.refresh();
}]);
