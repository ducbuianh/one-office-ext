const SHIFT_800 = 1;
const SHIFT_830 = 2;

const ANNUAL_LEAVE_DONE = 4;
const CHECKIN_CHECKOUT_DONE = 3;
const OVERTIME_COMPENSATE_DONE = 2;
const OVERTIME_DONE = 1;
const NONE = 0;

function toMinute(timeStr) {
  return parseInt(timeStr.split(":")[0] * 60 + timeStr.split(":")[1])
}

function isOvertimeLate(shift, end) {
  if (shift == SHIFT_800) {
    if (isValidTime(end) && toMinute(end) > toMinute("17:05")) return true;
  } else {
    if (isValidTime(end) && toMinute(end) > toMinute("17:30")) return true;
  }
  return false;
}

function isOvertimeEarly(shift, start) {
  if (shift == SHIFT_800) {
    if (isValidTime(start) && toMinute(start) < toMinute("08:00")) return true;
  } else {
    if (isValidTime(start) && toMinute(start) < toMinute("08:30")) return true;
  }
  return false;
}

function isLate(shift, start) {
  if (shift == 1) {
    if (toMinute(start) >= toMinute("8:05") && toMinute(start) <= toMinute("10:05")) return true;
  } else {
    if (toMinute(start) > toMinute("8:30") && toMinute(start) < toMinute("10:30")) return true;
  }
  return false;
}

function isEarly(shift, end) {
  if (shift == SHIFT_800) {
    if (toMinute(end) < toMinute("17:00")) return true;
  } else {
    if (toMinute(end) < toMinute("17:30")) return true;
  }
  return false;
}

function currentStatus(elem) {
  if (elem.querySelector("span.icon-realtime-protection")) return CHECKIN_CHECKOUT_DONE;
  if (elem.querySelector("span.icon-umbrella")) return ANNUAL_LEAVE_DONE;
  if (elem.querySelector("span.icon-star") && (elem.querySelector("span.icon-circled-user-male") || elem.querySelector("span.icon-circled-user-female"))) return OVERTIME_COMPENSATE_DONE;
  if (elem.querySelector("span.icon-star")) return OVERTIME_DONE;
  return NONE;
}

function isValidTime(time) {
  return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
}

function createOvertimeData() {
  var elems = document.querySelectorAll("td.dialog-done.pop-done.pop-control.pop-control-click.pop-connect");
  var overtimeNotCompleteData = [];
  var shift = getShift();
  elems.forEach(function(elem){
    if (currentStatus(elem) === OVERTIME_DONE || currentStatus(elem) === OVERTIME_COMPENSATE_DONE) return;
    var date = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(1)").innerText
    var timeElem = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(3)")
    if (timeElem) {
      var time = timeElem.innerText
    }
    if (time && time !== "") {
      var actualWorkStart = time.split("-")[0].trim();
      var actualWorkEnd = time.split("-")[1].trim();
      var status = currentStatus(elem);
      if (isOvertimeLate(shift, actualWorkEnd)) {
        var overtimeStart = shift == SHIFT_800 ? "17:01" : "17:31";
        var overtimeEnd = actualWorkEnd;
        var row = [date + "/" + (new Date()).getFullYear(), overtimeStart, overtimeEnd];
        if (status == NONE) overtimeNotCompleteData.push(row);
      }
      if (isOvertimeEarly(shift, actualWorkStart)) {
        var overtimeStart = actualWorkStart
        var overtimeEnd = shift == SHIFT_800 ? "08:00" : "08:30";
        var row = [date + "/" + (new Date()).getFullYear(), overtimeStart, overtimeEnd];
        if (status == NONE) overtimeNotCompleteData.push(row);
      }
    }
  });

  closeDialog();

  if ($("#w1l-notice")) {
    $("#w1l-notice").remove();
  }

  if (overtimeNotCompleteData.length > 0) {
    unHighLight();
    highLight(overtimeNotCompleteData);
    localStorage.setItem("1office_overtime_data", JSON.stringify(overtimeNotCompleteData));
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;\" colspan=\"7\">Những ngày đến sớm/ về muộn chưa có đơn Overtime đã được bôi đỏ, hãy kiểm tra lại và click: <button onClick=\"createOvertime();\">Continue</button> để tạo đơn Overtime</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  } else {
    unHighLight();
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;color:green;\" colspan=\"7\">Hmmm... có vẻ bạn không có ngày nào overtime.</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  }
}

function createOvertime() {
  var data = JSON.parse(localStorage.getItem('1office_overtime_data'));
  if (!data) return;

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://pixta.1office.vn/approval-overtime-overtime/add?_json=1', true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      localStorage.removeItem('1office_overtime_data');
      var redirect = JSON.parse(xhr.response).redirect;
      window.location.replace('https://pixta.1office.vn/' + redirect);
    }
  };

  var param = new FormData();

  param.append('method', 'mine');
  param.append('inlineLogin', 1);
  data.forEach((line, i) => {
    param.append('detail[' + i + '][date]', line[0]);
    param.append('detail[' + i + '][start_time]', line[1]);
    param.append('detail[' + i + '][end_time]', line[2]);
    param.append('detail[' + i + '][type]', 1);
    param.append('detail[' + i + '][is_attendance]', 1);
  });

  xhr.send(param);
}

// function getLatestOvertimeId() {
//   return new Promise(function (resolve, reject) {
//     var xhr = new XMLHttpRequest();
//     xhr.open('GET', 'https://pixta.1office.vn/approval-overtime-overtime?menu=private&_json=1', true);
//     xhr.onload = function () {
//       if (this.status >= 200 && this.status < 300) {
//         resolve(xhr.response);
//       } else {
//         reject({
//           status: this.status,
//           statusText: xhr.statusText
//         });
//       }
//     };
//     xhr.onerror = function () {
//       reject({
//         status: this.status,
//         statusText: xhr.statusText
//       });
//     };
//     xhr.send();
//   });
// }

function createAbsenceData() {
  var elems = document.querySelectorAll("td.dialog-done.pop-done.pop-control.pop-control-click.pop-connect");
  var absenceData = [];
  var shift = getShift();
  elems.forEach(function(elem){
    if (currentStatus(elem) === OVERTIME_COMPENSATE_DONE) return;
    var date = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(1)").innerText
    var timeElem = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(3)")
    if (timeElem) {
      var time = timeElem.innerText
    }
    if (time && time !== "") {
      var actualWorkStart = time.split("-")[0].trim();
      var actualWorkEnd = time.split("-")[1].trim();
      var status = currentStatus(elem);
      if (isLate(shift, actualWorkStart)) {
        var absenceStart = shift == SHIFT_800 ? "08:00" : "08:30";
        var absenceEnd = actualWorkStart
        var row = [date + "/" + (new Date()).getFullYear(), absenceStart, absenceEnd];
        absenceData.push(row);
      }
      if (isEarly(shift, actualWorkEnd)) {
        var absenceStart = actualWorkEnd
        var absenceEnd = shift == SHIFT_800 ? "17:00" : "17:30";
        var row = [date + "/" + (new Date()).getFullYear(), absenceStart, absenceEnd];
      }
    }
  });

  closeDialog();

  if ($("#w1l-notice")) {
    $("#w1l-notice").remove();
  }

  if (absenceData.length > 0) {
    unHighLight();
    highLight(absenceData);
    localStorage.setItem("1office_absence_data", JSON.stringify(absenceData));
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;\" colspan=\"7\">Những ngày đi muộn/về sớm đã được bôi đỏ, hãy kiểm tra lại và click: <button onClick=\"createAbsence();\">Continue</button> để gửi đơn vắng mặt</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  } else {
    unHighLight();
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;color:green;\" colspan=\"7\">Hmmm... có vẻ bạn không còn gì phải làm cả</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  }
}

function createAbsence() {
  var data = JSON.parse(localStorage.getItem('1office_absence_data'));
  if (!data) return;
  data.forEach((line, i) => {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://pixta.1office.vn/approval-absence-absence/add?_json=1', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (xhr.readyState == 4 && xhr.status == 200) {
          localStorage.removeItem('1office_absence_data');
          window.location.replace('https://pixta.1office.vn/approval-absence-absence?menu=private');
        }
      }
    };
    var param = new FormData();
    param.append('method', 'mine');
    param.append('reason', '37');
    param.append('date_start', line[0]);
    param.append('time_start', line[1]);
    param.append('time_end', line[2]);
    param.append('desc', 'personal issue');
    param.append('inlineLogin', '1');

    xhr.send(param);
  });
}

function createInOutData() {
  var elems = document.querySelectorAll("td.dialog-done.pop-done.pop-control.pop-control-click.pop-connect");
  var inOutData = [];
  var shift = getShift();
  elems.forEach(function(elem){
    if (currentStatus(elem) === CHECKIN_CHECKOUT_DONE) return;
    var date = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(1)").innerText
    var timeElem = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(3)")
    if (timeElem) {
      var time = timeElem.innerText
    }
    if (time && time !== "") {
      var actualWorkStart = time.split("-")[0].trim();
      var actualWorkEnd = time.split("-")[1].trim();
      var status = currentStatus(elem);
      if (!isValidTime(actualWorkStart) || !isValidTime(actualWorkEnd)) {
        var dateArr = (date + "/" + (new Date()).getFullYear()).split("/");
        var row = [date + "/" + (new Date()).getFullYear(), actualWorkStart, actualWorkEnd];
        console.log(dateArr);
        if (!(new Date()).toDateString() == (new Date(dateArr[2]+"/"+dateArr[1]+"/"+dateArr[0])).toDateString()) {
          inOutData.push(row);
        }
      }
    }
  });

  closeDialog();

  if ($("#w1l-notice")) {
    $("#w1l-notice").remove();
  }

  if (inOutData.length > 0) {
    unHighLight();
    highLight(inOutData);
    localStorage.setItem("1office_inout_data", JSON.stringify(inOutData));
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;\" colspan=\"7\">Những ngày không có check-in/check-out đã được bôi đỏ, hãy kiểm tra lại và click: <button onClick=\"createOvertime();\">Continue</button> để tạo đơn Checkin/Checkout</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  } else {
    unHighLight();
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;color:green;\" colspan=\"7\">Thông tin checkin/checout của bạn đã đầy đủ.</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  }
}

function createInOut() {
  var data = JSON.parse(localStorage.getItem('1office_inout_data'));
  if (!data) return;
  data.forEach((line, i) => {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://pixta.1office.vn/approval-absence-absence/add?_json=1', true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState == 4 && xhr.status == 200) {
        if (xhr.readyState == 4 && xhr.status == 200) {
          localStorage.removeItem('1office_inout_data');
          window.location.replace('https://pixta.1office.vn/approval-inout-inout?menu=private');
        } else {
          console.log(this.responseText);
          alert(this.responseText);
        }
      }
    };


    var shift = getShift();
    var param = new FormData();
    if (shift == SHIFT_800) {
      var time = !isValidTime(line[1]) ? "08:00" : "17:00"
    } else {
      var time = !isValidTime(line[1]) ? "08:30" : "17:30"
    }

    param.append('method', 'mine');
    param.append('inlineLogin', 1);
    data.forEach((line, i) => {
      param.append('detail[' + i + '][date]', line[0]);
      param.append('detail[' + i + '][time]', time);
      param.append('detail[' + i + '][reason]', NO_FINGER);
    });

    xhr.send(param);
  });
}

function getAbsenceData() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://pixta.1office.vn/approval/absence/helper/getnb', true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      if (xhr.readyState == 4 && xhr.status == 200) {
        console.log(this.responseText);
        data = JSON.parse(this.responseText);
        //closeDialog();
        alert("Tổng thời gian nghỉ bù: " + data.nb_total + " giờ\n" +
              "Đã sử dụng: " + data.nb_used + " giờ\n" +
              "Còn lại: " + data.nb_amount + " giờ");
      } else {
        console.log(this.responseText);
        alert(this.responseText);
      }
    }
  };

  var param = new FormData();
  param.append('method', 'mine');
  param.append('inlineLogin', 1);
  param.append('reason', 37);
  param.append('post_id', 0);

  xhr.send(param);
}

function getLeaveData() {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://pixta.1office.vn/approval/leave/helper/getnumber', true);
  xhr.onload = function () {
    if (xhr.readyState == 4 && xhr.status == 200) {
      console.log(this.responseText);
      data = JSON.parse(this.responseText);
      alert("Tổng phép: " + data.number_total + " ngày\n" +
            "Đã nghỉ: " + data.number_leave + " ngày\n" +
            "Còn lại: " + data.number_rest + " ngày");
    }
  };

  xhr.onerror = function (e) {
    console.error(xhr.statusText);
  };

  var param = new FormData();
  param.append('method', 'mine');
  param.append('inlineLogin', 1);
  param.append('reason', 24);
  param.append('post_id', 0);
  param.append('personnel_id', 43);
  var date = new Date();
  param.append('date', date.getDate() + "/" + (("0" + (date.getMonth() + 1)).slice(-2)) + "/" + date.getFullYear());

  xhr.send(param);
}

function findDateElem(date) {
  var elems = document.querySelectorAll("td.dialog-done.pop-done.pop-control.pop-control-click.pop-connect");
  var target = null;
  elems.forEach(function(elem){
    var dateStr = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(1)").innerText
    if (date.substring(0,5) == dateStr) target = elem;
  });
  return target;
}

function unHighLight() {
  var elems = document.querySelectorAll("td.dialog-done.pop-done.pop-control.pop-control-click.pop-connect");
  elems.forEach(function(elem){
    elem.style.backgroundColor = "#fff";
  });
}

function highLight(data) {
  data.forEach(function(row) {
    var elem = findDateElem(row[0]);
    if (elem) {
      elem.style.backgroundColor = "#ff6666";
    }
  });
}

function closeDialog() {
  $("#w1l-select-shift-dialog").addClass("hidden");
  $(".pop-overlay").remove();
}

function showDialog() {
  $("#w1l-select-shift-dialog").removeClass("hidden");
  $("body").prepend("<div class='pop-overlay' style='background: rgba(0, 0, 0, 0.1); cursor: pointer; top: 0px; left: 0px; right: 0px; bottom: 0px; position: fixed; transition: background-color 3s ease 0s; transform: none; z-index: 1000000;'></div>");
}

function setShift(shift) {
  document.getElementById("w1l-shift-" + shift).setAttribute("checked","");
  document.getElementById("w1l-shift-" + [SHIFT_800,SHIFT_830].filter(item => item !== shift)).removeAttribute("checked");
}

function getShift() {
  if (document.getElementById("w1l-shift-1").getAttribute("checked") === "checked") return SHIFT_800;
  else return SHIFT_830;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "timesheet_load" ) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.innerHTML = "const SHIFT_800=1;const SHIFT_830=2;const ANNUAL_LEAVE_DONE = 4;const CHECKIN_CHECKOUT_DONE=3;const OVERTIME_COMPENSATE_DONE=2;const OVERTIME_DONE=1;const NONE=0;" +
                         createOvertime.toString() + ";" +
                         createAbsence.toString() + ";" +
                         closeDialog.toString() + ";" +
                         toMinute.toString() + ";" +
                         isLate.toString() + ";" +
                         isEarly.toString() + ";" +
                         isOvertimeLate.toString() + ";" +
                         isOvertimeEarly.toString() + ";" +
                         findDateElem.toString() + ";" +
                         currentStatus.toString() + ";" +
                         highLight.toString() + ";" +
                         unHighLight.toString() + ";" +
                         setShift.toString() + ";" +
                         getShift.toString() + ";" +
                         isValidTime.toString() + ";" +
                         createInOut.toString() + ";" +
                         createInOutData.toString() + ";" +
                         createAbsenceData.toString() + ";" +
                         createOvertimeData.toString() + ";" +
                         getAbsenceData.toString() + ";" +
                         getLeaveData.toString() + ";";
      document.head.appendChild(script);
      $("body").prepend("<div id='w1l-select-shift-dialog' class='dialog pop-bold pop-box pop-box-click pop-box-contextmenu pop-alert draggable-done hidden' tabindex='-1' remove-monitor='1' style='max-width: 90%; position: fixed; z-index: 1000001; visibility: visible; pointer-events: visible; top: 25%; left: 40%; opacity: 1;' draggable='false' _draggable='true'> <div class='dialog-header'> <span class='dialog-title'>What 1office lacks</span> <i ignore-draggable='' onclick='closeDialog();' class='dialog-close icon-multiply'></i> </div><div class='dialog-content'> <div class='dialog-message'> Hãy chọn ca làm việc:<br><div class='form-group form-buttons'> <div> <div id='w1l-shift-1' onclick='setShift(SHIFT_800)' no-render='' class='checks radio' render-elem='1' title='Ctrl + Shift + Space' tabindex='0' checked='checked'> <div></div></div>8:00<br><div id='w1l-shift-2' onclick='setShift(SHIFT_830)' no-render='' class='checks radio' render-elem='1' title='Ctrl + Shift + Space' tabindex='0'> <div></div></div>8:30 </div></div><div class='form-group form-buttons'> <div class='form-buttons'> <button class='btn btn-default' onClick='getAbsenceData()'>Kiểm tra quỹ thời gian nghỉ bù</button> </div></div><div class='form-group form-buttons'> <div class='form-buttons'> <button class='btn btn-default' onClick='getLeaveData()'>Kiểm tra số ngày phép</button> </div></div>Lựa chọn đơn cần tạo:<br><br><div class='form-group form-buttons'> <div class='form-buttons'> <button class='btn btn-default' onClick='createOvertimeData()'>Đơn làm thêm</button> <button class='btn btn-default' onClick='createAbsenceData()'>Đơn nghỉ bù</button> </div></div><div class='form-group form-buttons'> <div class='form-buttons'> <button class='btn btn-default' onClick='alert(\"Available soon\")'>Đơn checkin/checkout</button> <button class='btn btn-default' onClick='alert(\"Available soon\")'>Đơn nghỉ phép</button> </div></div></div></div></div>");
    } else if( request.message === "clicked_browser_action" ) {
      var url = window.location.href;
      if (url.includes("user/attendance")) {
        showDialog();
      }
    }
  }
);
