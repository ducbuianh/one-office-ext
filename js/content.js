function toMinute(timeStr) {
  return timeStr.split(":")[0] * 60 + timeStr.split(":")[1]
}

function isLate(shift, start) {
  if (shift == 1) {
    if (toMinute(start) >= toMinute("8:05")) return true;
  } else {
    if (toMinute(start) > toMinute("8:30")) return true;
  }
  return false;
}

function isEarly(shift, end) {
  if (shift == 1) {
    if (toMinute(end) < toMinute("17:00")) return true;
  } else {
    if (toMinute(end) < toMinute("17:30")) return true;
  }
  return false;
}

function currentStatus(elem) {
  if (elem.querySelector("span.icon-star") && (elem.querySelector("span.icon-circled-user-male") || elem.querySelector("span.icon-circled-user-female"))) return 2;
  if (elem.querySelector("span.icon-star")) return 1;
  return 0;
}

function createData(shift) {
  var elems = document.querySelectorAll("td.dialog-done.pop-done.pop-control.pop-control-click.pop-connect");
  var overtimeNotCompleteData = [];
  var overtimeCompleteData = [];
  elems.forEach(function(elem){
    if (currentStatus(elem) === 2) return;
    var date = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(1)").innerText
    var timeElem = elem.querySelector("div:nth-child(1)").querySelector("div:nth-child(3)")
    if (timeElem) {
      var time = timeElem.innerText
    }
    if (time && time !== "") {
      var actualWorkStart = time.split("-")[0].trim();
      var actualWorkEnd = time.split("-")[1].trim();
      var status = currentStatus(elem);
      if (isLate(shift, actualWorkStart) || isEarly(shift, actualWorkEnd)) {
        var overtimeStart = shift == 1 ? "17:01" : "17:31";
        var shiftStart = shift == 1 ? "08:00" : "08:30";
        var row = [date + "/" + (new Date()).getFullYear(), overtimeStart, actualWorkEnd, shiftStart, actualWorkStart, status];
        if (status == 0) overtimeNotCompleteData.push(row);
        if (status == 1) overtimeCompleteData.push(row);
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
    localStorage.setItem("1office_late_data", JSON.stringify(overtimeNotCompleteData));
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;\" colspan=\"7\">Bạn vẫn còn những ngày chưa có đơn Overtime, hãy kiểm tra lại và click: <button onClick=\"createOvertime();\">Continue</button> để tạo đơn Overtime</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  } else if (overtimeCompleteData.length > 0) {
    unHighLight();
    highLight(overtimeCompleteData);
    localStorage.setItem("1office_late_data", JSON.stringify(overtimeCompleteData));
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;\" colspan=\"7\">Những ngày đi muộn có đơn Overtime được duyệt xong đã được bôi đỏ, hãy kiểm tra lại và click: <button onClick=\"createAbsence();\">Continue</button> để gửi đơn vắng mặt</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  } else {
    unHighLight();
    $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;color:green;\" colspan=\"7\">Chúc mừng bạn chả còn gì để làm ở đây cả</td></tr>");
    $("html, body").animate({ scrollTop: 0 }, "fast");
  }
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

function createOvertime() {
  window.location.replace('https://pixta.1office.vn/approval-overtime-overtime/add');
}

function createAbsence(){
  chrome.runtime.sendMessage('mpopoanebhlmbfmefibhbeakgghnnica',{'message': 'create_absence'}, function(response) {});
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
  document.getElementById("w1l-shift-" + [1,2].pop(shift)[0]).removeAttribute("checked");
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if( request.message === "timesheet_load" ) {
      var script = document.createElement("script");
      script.type = "text/javascript";
      script.innerHTML = createOvertime.toString() + ";" +
                         createAbsence.toString() + ";" +
                         closeDialog.toString() + ";" +
                         toMinute.toString() + ";" +
                         isLate.toString() + ";" +
                         findDateElem.toString() + ";" +
                         currentStatus.toString() + ";" +
                         highLight.toString() + ";" +
                         unHighLight.toString() + ";" +
                         setShift.toString() + ";" +
                         createData.toString() + ";";
      document.head.appendChild(script);
      $("body").prepend("<div id='w1l-select-shift-dialog' class='dialog pop-bold pop-box pop-box-click pop-box-contextmenu pop-alert draggable-done hidden' tabindex='-1' remove-monitor='1' style='max-width: 90%; position: fixed; z-index: 1000001; visibility: visible; pointer-events: visible; top: 398.5px; left: 821.5px; opacity: 1;' draggable='false' _draggable='true'><div class='dialog-header'><span class='dialog-title'>What 1office lacks</span><i ignore-draggable='' onclick='closeDialog();' class='dialog-close icon-multiply'></i></div><div class='dialog-content'><div class='dialog-message'>Hãy chọn ca làm việc:<br><div class='form-group form-buttons'><div><div id='w1l-shift-1' onclick='setShift(1)' no-render='' class='checks radio' render-elem='1' title='Ctrl + Shift + Space' tabindex='0' checked='checked'><div></div></div>8:00<br><div id='w1l-shift-2' onclick='setShift(2)' no-render='' class='checks radio' render-elem='1' title='Ctrl + Shift + Space' tabindex='0'><div></div></div>8:30</div></div></div></div></div>");
      //$("body").prepend("<div id='w1l-select-shift-dialog' class='dialog pop-bold pop-box pop-box-click pop-box-contextmenu pop-alert draggable-done hidden' tabindex='-1' remove-monitor='1' style='max-width: 90%; position: fixed; z-index: 1000001; visibility: visible; pointer-events: visible; top: 398.5px; left: 821.5px; opacity: 1;' draggable='false' _draggable='true'><div class='dialog-header'><span class='dialog-title'>What 1office lacks</span><i ignore-draggable='' onClick='closeDialog();' class='dialog-close icon-multiply'></i></div><div class='dialog-content'><div class='dialog-message'>Hãy chọn ca làm việc:<br><br><div class='form-group form-buttons'><div style='margin: 0 auto;' class='form-buttons'><button onClick='createData(1)' class='btn'>8:00</button><button class='btn btn-default' onClick='createData(2)'>8:30</button></div></div></div></div></div>");
    } else if( request.message === "clicked_browser_action" ) {
      var url = window.location.href;
      if (url.includes("user/attendance")) {
        showDialog();
      }
    } else if (request.message === "create_overtime") {
      var data = JSON.parse(localStorage.getItem('1office_late_data'));
      if (!data) return;
      var inputs = ["date", "start_time", "end_time", "note"];
      data.forEach((line, i) => {
        setTimeout(function(){
          document.querySelector("input[name='detail[" + i + "][date]").value = line[0];
          document.querySelector("input[name='detail[" + i + "][start_time]").value = line[1];
          document.querySelector("input[name='detail[" + i + "][end_time]").value = line[2];
          document.querySelector("input[name='detail[" + i + "][note]").value = "Làm bù " + line[0];
        }, 2000);
        if (i !== 0 && i < data.length) {
          document.querySelector('a.icon-plus').click();
        }
      });
      localStorage.removeItem('1office_late_data');
    } else if (request.message === "create_absence") {
      var data = JSON.parse(localStorage.getItem('1office_late_data'));
      if (!data) return;
      data.forEach((line, i) => {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://pixta.1office.vn/approval-absence-absence/add?_json=1', true);
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4 && xhr.status == 200) {
            console.log(this.responseText);
            $("#w1l-notice").remove();
            unHighLight();
            $("#action-content table").prepend("<tr id=\"w1l-notice\"><td style=\"padding: 10px;font-size:14px;color:green;\" colspan=\"7\">Chúc mừng bạn chả còn gì để làm ở đây cả</td></tr>");
            $("html, body").animate({ scrollTop: 0 }, "fast");
          }
        };
        var param = new FormData();
        param.append('method', 'mine');
        param.append('reason', '37');
        param.append('date_start', line[0]);
        param.append('time_start', line[3]);
        param.append('time_end', line[4]);
        param.append('desc', 'personal issue');
        param.append('inlineLogin', '1');

        xhr.send(param);
      });
      localStorage.removeItem('1office_late_data');
    }
  }
);
