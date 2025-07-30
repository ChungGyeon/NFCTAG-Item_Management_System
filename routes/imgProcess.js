/*
* 이미지를 처리하는 라우터
* 이미지처리를 위한 multer SET
* 이미지 처리 요청(이미지 불러오기, 붙여넣기, 서버에 등록하기 등
*
* 사용법
* 나도 기억안남
* 이미지 저장은 StoreImg_upload을 쓰는건 맞음
* upload.single('myFile') : myFile은 html태그에서 input 태그에 name=여기에 해당함,
* 즉 name-=yFile인 input태그를 upload.single함수에 인자로 주는거야
*
*
* */

const express = require('express');
const router = express.Router();
const multer  = require('multer');
const path = require("path");
const fs = require('fs');
const { db }= require('./IMS_db'); // DB 연결


const upload = multer({
    storage: multer.diskStorage({
        //파일저장 위치 지정, file의 이름을 로그에 출력하고 images 폴더에 이미지 저장
        destination(req, file, done) {
            console.log(file);
            done(null, "public/images");
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            const safeName = Buffer.from(basename, 'latin1').toString('utf8');
            const uniqueSuffix = Date.now();
            console.log(file);
            done(null, `${safeName}-${uniqueSuffix}${ext}`);
        }
    })
});

//menu_modify.ejs에서 이미지 선택 후 업로드 클릭 시 서버 로그에 파일 디테일을 출력함, 336~342line
router.post('/updateItem', upload.single('image'), (req, res) => {
    try {
        if(!req.file && !req.body.itemName){ //이미지랑 수정된 이름 둘다 제공 x시
            return res.status(400).json({
                success: false,
                error: "이미지와 수정된 이름이 제공되지 않았습니다."
            });
        }

        const updateData = {};
        if(req.file) updateData.img = req.file.filename;
        if(req.body.itemName) updateData.itemName = req.body.itemName;


        const setClause = Object.keys(updateData)
            .map(key => `${key} = ?`)
            .join(', ');

        const updateSQL = `UPDATE Items SET ${setClause} WHERE itemName = ?`
        const values = [...Object.values(updateData), req.body.originItemName];

        const imgDeleteSQL = `SELECT img FROM Items WHERE itemName = ?`;
        db.query(imgDeleteSQL, [req.body.originItemName], (err, result) => {
            if(err) throw err;

            const oldImage = result[0]?.img; // 이전 이미지 파일명

            // 이전 이미지가 있다면 삭제
            if (oldImage) {
                const imagePath = path.join('public/images', oldImage);
                fs.unlink(imagePath, (err) => {
                    if (err && err.code !== 'ENOENT') {
                        console.error('이전 이미지 삭제 중 에러:', err);
                    }
                });
            }

            db.query(updateSQL, values, (err, result) => {
                if (err) throw err;
                res.json({
                    success: true,
                    message: "아이템이 성공적으로 업데이트되었습니다.",
                    updates: updateData
                });
            });
        });

    } catch (error) {
        console.error('아이템 업데이트 중 에러 발생:', error);
        res.status(500).json({
            success: false,
            error: "서버 에러가 발생했습니다."
        });
    }
});




module.exports = router;


/*
//menu_modify.ejs에서 이미지 선택 후 업로드 클릭 시 서버 로그에 파일 디테일을 출력함, 336~342line
app.post('/StoreImg_upload', upload.single('myFile'), (req, res) => {
    try{
        if (!req.file) {
            return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
        }
        //res.json({ filename: req.file.originalname });
        res.redirect(`UserStore/UserStore_admin/Modifying_menu_page/UserStore_menu_modify?filename=${encodeURIComponent(req.file.originalname)}`);
    } catch (error) {
       console.error('이미지 업로드 중 에러 발생: ', err);
       res.status(500).send('서버 에러');
    }
});

app.post('/addToMenuInfo', upload.single('myFile'),(req, res) => {
    console.log('req.file:', req.file);
    var id = 0;
    if (req.body.id == 0) {
        id = 1;
        insertMenu();
    } else {
        const fInd_max_id_from_menu = 'SELECT MAX(id) as max_id FROM menu';
        db.query(fInd_max_id_from_menu, (err, result) => {
            if (err) {
                console.error('id 조회 실패: ' + err.stack);
                res.status(500).send('데이터베이스 쿼리 실패');
                return;
            }
            id = (result[0].max_id || 0) + 1;
            insertMenu();
        });
    }

    function insertMenu() {
        const { name, price, description } = req.body;
        const image_url = req.file? req.file.filename : null;
        const storeName = req.session.storeID;
        const sql = 'INSERT INTO menu (id, name, price, description, image_url, store_name) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(sql, [id, name, price,description, image_url, storeName], (err, result) => {
            if (err) {
                console.error('쿼리가 제대로 명시되지 않았습니다.: ' + err.stack);
                res.status(500).send('데이터베이스 쿼리 실패');
                return;
            }
            res.redirect('/UserStore/UserStore_admin/Modifying_menu_page/UserStore_menu_modify');
        });
    }
});
* 이건 졸작에서 사용하던 멀터이용하는 코드들*/


/*
여긴 멀터를 사용하는 페이지에 넣어야할 js
function uploadImage() { //메뉴 추가에서 이미지를 서버에 업로드 용 로직
      const imageInput = document.getElementById('imge_UploadForm');
      const formData = new FormData();
      formData.append('myFile', imageInput.files[0]);

      fetch('/StoreImg_upload', {
          method: 'POST',
          body: formData
      })
      .then(response => response.json())
      .then(data => {
          if (data.filename) {
              document.getElementById('image_url').value = data.filename;
              alert('이미지 업로드 완료!');
          } else {
              alert('이미지 업로드 실패!');
          }
      })
      .catch(error => console.error('업로드 오류:', error));
  }

  //이미지 업로드 시 자동으로 이미지 파일명을 입력해주는 기능
  function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        document.addEventListener('DOMContentLoaded', () => {
            const filename = getQueryParam('filename');
            if (filename) {
                document.getElementById('image_url').value = filename;
            }
        });

*/