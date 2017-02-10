var app = (function(){
    var cache = {
        tasks: [  ]
    };

    var ctrl = {
        init: function() {
            
            $.ajax({
                type: "POST",
                url: "index.php",
                data: { 
                    action: "getAll",
                    data: "" 
                }
            }).done(function(tasks){
                cache = JSON.parse(tasks);
                cache.tasks.forEach( task => view.renderTask(task)  );
            });

            view.init();
            
        }, 
        postTask: function(e) {       
            e.preventDefault();    
            var newTask = { 
             action: "addTask",
             data: JSON.stringify({                 
                id: 0,
                name: $("#inp_name").val() || "",
                email: $("#inp_email").val() || "",
                img: $("#inp_img").val() || "",
                text: $("#inp_text").val() || "",
                complete: false
             })
            };

            $.ajax({
                type: "POST", 
                url: "index.php", 
                data: newTask    
            }).done(function(task) {                
                task = JSON.parse(task);
                cache.tasks.push(task);
                view.renderTask(task); 
                  $("#inp_name").val("");
                 $("#inp_email").val("");
                 $("#inp_img").val("");
                 $("#inp_text").val("");
            });
        },
        admin: function(e) {
            e.preventDefault();
            var APIcall = { 
             action: "admin",
             data: JSON.stringify({  
                u: $("#u").val(),
                p: $("#p").val()
             })
            };

            $.ajax({
                type: "POST", 
                url: "index.php", 
                data: APIcall    
            }).done(function(result) {                
                if(result === 'ok') {
                    view.renderAdmin();
                    alert('success');                    
                } else {
                    alert('access denied');
                }
            });

        },
        editTask: function(id, text) {           
            var APIcall = { 
                action: "editTask",
                data: JSON.stringify({  
                    id: id,
                    text: text
                })
            };
            $.ajax({
                type: "POST", 
                url: "index.php", 
                data: APIcall    
            }).done(function(result) {

            });
        }, 
        completeTask: function(e) {
            // Prevent duplicate event propagination triggered by parent <label>            
            if (e.target.tagName != 'INPUT') { return false; }

            var APIcall = { 
                action: "completeTask",
                data: JSON.stringify({  
                    id: e.target.id
                })
            };

            $.ajax({
                type: "POST", 
                url: "index.php", 
                data: APIcall    
            }).done(function(result) { 
                return result;
            });
        }                             
     };

    var view = {
        todoList: document.body.querySelector('#todolist'),
        image: null,
        init: function() {
            // Auto resize image once it's added to the browser            
            $('#inp_file').on('change', fileChange);
            $("#inp_file_mock").on('click', (e) => {
                e.preventDefault();
                $('#inp_file').click();
            })
            // Push new task to server                 
            $("#bt_save").on('click', ctrl.postTask);          
            $("#bt_preview").on('click', view.renderPreviewTask);
            // Admin login
            $("#bt_admin").on('click', ctrl.admin);
            // Sorting 
            $("#bt_name").on('click', view.sortTasks);
            $("#bt_email").on('click', view.sortTasks);
            $("#bt_complete").on('click', view.sortTasks);
        },

        renderTask: function(task /*JSON Object*/) { 
            if(task.complete) {
                var checked = 'checked';
                var className = 'complete';
                var parentClass = 'complete-parent';
            } else {
                var parentClass = '';
                var checked = '';
                var className = '';
            }

            var template = `<div class="task-template ${parentClass}">    
            
                <label class="control control--checkbox ${className}">
                    Is it completed?
                    <input id="${task.id}" type="checkbox" ${checked} disabled>
                    <div class="control__indicator"></div>
                </label>
                <span>${task.name}</span> | <span>${task.email}</span>
            
            <div class="img">
            <img class="task-image" src="${task.img}" alt="Image of task-${task.id}">
            </div>
            <p>${task.text}</p>
            <textarea class="edit-area" style="display:none">${task.text}</textarea>
            <button id="${task.id}" class="bt_change" style="display:none">Save Changes</button>
            </div>`;
	        
            // workaround - otherwise innerHTML destroys event handlers of previous childs
            var tempNode       = document.createElement("div");
	        tempNode.innerHTML = template;
            $.extend(tempNode.firstChild, task);
	        view.todoList.insertBefore(tempNode.firstChild, view.todoList.firstChild);
        },

        renderAdmin: function() { 
                 // Enables admin functionality:
                 // task completion, tesk text editing.
                 // Functionality remains enabled until browser's refreshed.
                 $(':checkbox').prop('disabled', false); 
                 $('.bt_change').on('click', function(e) {
                    var text = $(e.target).siblings('.edit-area').val();
                    var id = e.target.id;
                    ctrl.editTask(id, text);
                    $(e.target).siblings('p').text(text);           
                }); 
                 $('.edit-area').show();
                 $('.bt_change').show();     
                 $(".control--checkbox").on('click' , function(e){
                    ctrl.completeTask(e);
                    // This is to prevent duplicate event propagation by parent <label> tag
                    if(e.target.tagName == 'INPUT') {
                          $(this).toggleClass('complete');
                          $(this).parent().toggleClass('complete-parent');
                    }
                 });
        },

        renderPreviewTask: function(e) {
                       
            var tab = $("#preview-bg")
            e.preventDefault();
            tab.show();
            tab.find("#pr-name").text($("#inp_name").val());
            tab.find("#pr-email").text($("#inp_email").val());
            tab.find("p").text($("#inp_text").val());
            if(document.getElementById('inp_img').value) {
                tab.find("img")
                    .attr('src', document.getElementById('inp_img').value);
            }
            tab.css('margin-top', '0px');
            tab.on('click', hideAndClear);
            $('#close-preview').on('click', hideAndClear);

            function hideAndClear(e) {
                tab.hide('slow');
                tab.find("#pr_name").text("");
                tab.find("#pr_email").text("");
                tab.find("p").text("");
                tab.find("img").attr("src", "http://placehold.it/500x250");
            }
        }, 

        sortTasks: function () {                            
                var sortedTasks = $('.task-template').sort( dynamicSort($(this).text()));
                $(view.todoList).append(sortedTasks);
        }                 
    };
    $('document').ready(ctrl.init());
}());






 
  function fileChange(e) { 
     document.getElementById('inp_img').value = '';
     
     var file = e.target.files[0];
 
     if (file.type == "image/jpeg" || file.type == "image/png" || file.type == "image/gif") {
         
        // create an HTML5 FileReader-object 
        // which is able to read the image data for us
        var reader = new FileReader();  

        reader.onload = function(readerEvent) {
            
           var image = new Image();

           image.onload = function(imageEvent) {    
              var max_size = 320;
              var w = image.width;
              var h = image.height;
             
              if (w > h) {  
                  if (w > max_size) { h*=max_size/w; w=max_size; }
              } else  {  
                  if (h > max_size) { w*=max_size/h; h=max_size; } }

              // Resizing 
              var canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              canvas.getContext('2d').drawImage(image, 0, 0, w, h);

               // IMG to a base64 encoded string  
              if (file.type == "image/jpeg") {
                 var dataURL = canvas.toDataURL("image/jpeg", 1.0);
              } else if (file.type == "image/png") {
                 var dataURL = canvas.toDataURL("image/png");   
              } else {
                  var dataURL = canvas.toDataURL("image/gif");  
              }
              // Store resized image
              document.getElementById('inp_img').value = dataURL;              
                 
           }
           image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(file);

     } else {
        document.getElementById('inp_file').value = ''; 
        alert('Please only select images in JPG, GIF or PNG-format.');  
     }
  }

function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
