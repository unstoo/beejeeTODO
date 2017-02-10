<?php

// Front router
if(count($_POST)) {

    $action = $_POST['action'];
    $data = $_POST['data'];
    
    $ctrl = new Controller();

    if (!$action || !method_exists($ctrl, $action)) {
        echo "Unknown API method.";
        return;
    } else if (method_exists($ctrl, $action)) {
        $ctrl->{$action}($data);
    }
} else { 
   Controller::initApp();
}


class Controller {

    public function addTask($data) {
        $model = new Model();
        $result = $model->addTask($data);

        if($result['status'] == 'ok') {
            View::publish($result['data']);
        } else {
            View::publish($result['status']);
        }
    }

    public function getAll() {
        $data = Model::getAll();
        View::publish($data);
    }

    public static function initApp() {
        View::initApp();
    }

    public function admin($data) {
        $model =  new Model();
        $details = json_decode($data, true);
        if($model->isAdmin($details['u'], $details['p']) === true) {
            echo "ok";
        } else {
            alert( "Incorrect username/password.");
        }
    }
    
    public function completeTask($data){
        $model = new Model();        
        $id = json_decode($data, true)['id'];
        $result = $model->completeTask($id);
    }

    public function editTask($data){
        $model = new Model();        
        $data = json_decode($data, true);
        $result = $model->editTask($data['id'], $data['text']);
    }

}

class Model {

    public static function getAll() {
        if(file_exists("../tasks.json")) {            
            $data = file_get_contents("../tasks.json");          
            return $data;
        }
        else {
            $data = [
                "tasks" => []
             ];
            file_put_contents("../tasks.json", json_encode($data));
            return json_encode($data);
        }        
    }

    public function addTask($newTask) {        
    
        $newTask = json_decode($newTask, true);

        $storage = self::getAll();
        $storage = json_decode($storage, true);

        if($storage['tasks'] === null) {             
            $storage['tasks'] = [];
        };
        
        $tasks_count = count($storage['tasks']);               
        $newTask['img'] = $this->saveImg($newTask['img'], $tasks_count);        
        $newTask['id'] = $tasks_count;
        $newTask['complete'] = false;
        
        array_push($storage['tasks'], $newTask);        
        
        $result = [];
        if( file_put_contents("../tasks.json", json_encode($storage)) ) {
            $result['status'] = "ok";
            $result['data'] =  json_encode($newTask);
        }
        else { 
            $result['status'] = "couldn't write task to file";
        }
        return $result;
    } 

    private function saveImg($dataURL, $id) {

        if ((strpos($dataURL, 'data:image') === 0)) {     

        $img = $dataURL;
    
        if (strpos($img, 'data:image/jpeg;base64,') === 0) {
            $img = str_replace('data:image/jpeg;base64,', '', $img);  
            $ext = '.jpg';
        }
        if (strpos($img, 'data:image/png;base64,') === 0) {
            $img = str_replace('data:image/png;base64,', '', $img); 
            $ext = '.png';      
        }
        if (strpos($img, 'data:image/gif;base64,') === 0) {
            $img = str_replace('data:image/gif;base64,', '', $img); 
            $ext = '.gif';
        }       

        $img = str_replace(' ', '+', $img);
        $data = base64_decode($img);
        $file = 'upload/img'.$id.$ext;    
    
            if (file_put_contents($file, $data)) {        
                return $file; //image path
            } else { 
                return ""; 
            }  

        } else {
            return "";
        }
    }

    public function isAdmin($usr, $pwd) {

        $details = file_get_contents("../admin.json");
        $details = json_decode($details, true);
        if ($details['u'] == $usr && $details['p'] == $pwd) {
            return true;
        } 
        return false;
    }

    public function completeTask($id) {
         $storage = json_decode(self::getAll(), true);
         $tasks = $storage['tasks'];

         foreach ($tasks as $key => $value) {             
             if($id == $value['id']) {
                 
                if($storage['tasks'][$id]['complete'] == false) {
                    echo "1";
                    $storage['tasks'][$id]['complete'] = true;
                } else {
                    echo "0";
                    $storage['tasks'][$id]['complete'] = false;
                }                 
                file_put_contents("../tasks.json", json_encode($storage));
                return;
            } 
        }
    }

    public function editTask($id, $text) {
        $storage = json_decode(self::getAll(), true);
        $tasks = $storage['tasks'];
        foreach ($tasks as $key => $value) {             
             if($id == $value['id']) { 
                 
                 $storage['tasks'][$id]['text'] = $text;                 
                if( file_put_contents("../tasks.json", json_encode($storage)) ) {
                    echo "ok";
                } else {
                    echo "couldn't save changes.";
                }
                return;
            } 
        }
    }
}

class View {

    public static function initApp() {
        if(is_readable(dirname(__DIR__).'/'."home.html")) 
        {            
            require(dirname(__DIR__).'/'."home.html");          
        } 
        else 
        {
            echo "File not readable.";
        }
    }

    public static function publish($data) {
        echo "$data";
    }
}

