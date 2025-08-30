/*
* 이미지를 처리하는 라우터
* 이미지처리를 위한 multer SET
* 이미지 처리 요청(이미지 불러오기, 붙여넣기, 서버에 등록하기 등
*
* 왠만한 기능이 어드민 용이라 어드민 페이지라고 봐도 무방함
* 다만 어드민 페이지로 접근하는건 imgProcess랑은 안어울리니 main.js에다 두고 있음
* 사용법
* 나도 기억안남
* 이미지 저장은 StoreImg_upload을 쓰는건 맞음
* upload.single('myFile') : myFile은 html태그에서 input 태그에 name=여기에 해당함,
* 즉 name-=yFile인 input태그를 upload.single함수에 인자로 주는거야
*
* 지금 이미지 저장위치는 반드시 public/images/item_IMG에만 저장하도록 되어있음
* 솔직히 말하면 나도 이 저장위치를 어떻게 다르게 할지 모르겠음 ㅋㅋ
* 하지만 현재로썬 이미지를 추가하는 기능은 IMS에서 물건 추가할떄 빼고는 없으므로 현상황으로 두겠어
*
* 추후 누군가 이를 추가적인 개발을 진행하신다면 참고해주십쇼
*
* */

const express = require('express');
const router = express.Router();
const multer  = require('multer');
const path = require("path");
const fs = require('fs');
const { db }= require('./sys_management/IMS_db'); // DB 연결


const upload = multer({
    storage: multer.diskStorage({
        //파일저장 위치 지정, file의 이름을 로그에 출력하고 images 폴더에 이미지 저장
        destination(req, file, done) {
            console.log(file);
            done(null, "public/images/item_IMG");
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            const basename = path.basename(file.originalname, ext);
            const safeName = Buffer.from(basename, 'latin1').toString('utf8');
            const uniqueSuffix = Date.now();
            const fileName = `${safeName}-${uniqueSuffix}${ext}`;
            const fullPath = `/images/item_IMG/${fileName}`;
            console.log(fullPath); //실제 파일명은 fileName임 주의, 그리고 이건 개발용이니 추후에 주석처리 할 수 있도록
            done(null, `${safeName}-${uniqueSuffix}${ext}`); //일단 테스트니까 fileName변수에 선언된 그대로 입력해봄

            req.fullImagePath = fullPath; //req갹체에 전체경로를 저장,  DB에 입력할 수 있도록 만듬
        }
    })
});


//어드민 물건수정 중 이미지 수정에 사용되는 거
router.post('/updateItem', upload.single('image'), (req, res) => {
    try {
        if (!req.file && !req.body.itemName) { //이미지랑 수정된 이름 둘다 제공 x시
            return res.status(400).json({
                success: false,
                error: "이미지와 수정된 이름이 제공되지 않았습니다."
            });
        }
        const updateData = {};
        if (req.file) updateData.img = req.fullImagePath || `images/item_IMG/${req.file.filename}`;
        if (req.body.itemName) updateData.itemName = req.body.itemName;


        const setClause = Object.keys(updateData)
            .map(key => `${key} = ?`)
            .join(', ');

            const updateSQL = `UPDATE Items
                               SET ${setClause}
                               WHERE itemName = ?`
            const values = [...Object.values(updateData), req.body.originItemName];
            const imgDeleteSQL = `SELECT img
                                  FROM Items
                                  WHERE itemName = ?`;

        db.query(imgDeleteSQL, [req.body.originItemName], (err, result) => {
            if (err) throw err;

            const oldImage = result[0]?.img; // 이전 이미지 파일명

            // 이전 이미지가 있다면 삭제
            if (oldImage) {
                const imagePath = path.join('public/images/item_IMG', oldImage);
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


// 관리자 물건 추가시 사진을 넣는 용도 라우트
router.post('/addItem', upload.single('itemImg'), (req, res) => {
    const { itemName } = req.body;

    if (!itemName) {
        return res.status(400).json({ message: '최소한 아이템 이름만은 필요합니다.' });
    }

    const imgPath = req.file
        ? (req.fullImagePath || `images/item_IMG/${req.file.filename}`)
        : null;

    const sql = 'INSERT INTO Items (itemName, img, status) VALUES (?, ?, 0)';
    db.query(sql, [itemName, imgPath], (err, result) => {
        if (err) {
            console.error('DB 오류:', err);
            return res.status(500).json({ message: 'DB 오류 발생' });
        }
        return res.status(200).json({ message: '아이템 추가 성공!' });
    });
});

/* ✅ 관리자 물건 삭제 기능 */
router.post('/deleteItems', (req, res) => {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: '삭제할 물건이 선택되지 않았습니다.'
        });
    }

    // 관리자 권한 확인 (선택사항)
    /*
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: '관리자 권한이 필요합니다.'
        });
    */

    // 선택된 물건들을 데이터베이스에서 삭제
    const placeholders = items.map(() => '?').join(',');
    const selectSQL = `SELECT img FROM Items WHERE itemName IN (${placeholders})`;

    db.query(selectSQL, items, (err, result) => {
        if (err) {
            console.error('DB 이미지 조회 오류:', err);
            return res.status(500).json({
                success: false,
                message: 'DB에서 이미지 조회 오류'
            });
        }

        const deleteSQL = `DELETE FROM Items WHERE itemName IN (${placeholders})`;
        db.query(deleteSQL, items, (err, deleteResult) => {
            if (err) {
                console.log('DB 삭제 오류: ', err);
                return res.status(500).json({
                    success: false,
                    message: 'DB 삭제 오류'
                });
            }

            //삭제 로직
            result.forEach(row => {
                if(row.img){
                    let imgPath;
                    if(row.img.startsWith('/images/item_IMG')) {
                        imgPath = path.join(__dirname, '../public', row.img);
                    }
                    else{
                        imgPath = path.join(__dirname, '../public/images/item_IMG', row.img);
                    }
                    fs.unlink(imgPath, (err) => {
                        if(err) console.log('이미지 파일 삭제 오류: ', err);
                        else console.log('이미지 삭제 완료', row.img);
                    });
                }
            });
            res.json({ success: true, message: `${deleteResult.affectedRows}개의 아이템이 삭제되었습니다.` });
        });
    });

});

//main.ejs의 대문 사진 요청 api
router.get('/mainImg', (req, res) => {
    const fileName = 'ITS-IMS.png';
    const imagePath = path.join(__dirname, '../public/images/mainPageIMG', fileName);

    // 파일 존재 확인
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('이미지 파일이 존재하지 않습니다.');
    }
});

//main.ejs의 아이템 사진 요청 api
router.get('/itemImg/:itemName', (req, res) => {
    const { itemName } = req.params;

    // DB에서 아이템 정보 조회 (파일명만 저장되어 있음)
    const sql = 'SELECT img FROM Items WHERE itemName = ?';

    db.query(sql, [itemName], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send('이미지를 찾을 수 없습니다.');
        }
        //이미지 없는 아이템일 경우 정해진 이미지를 전송
        // 아이템에 등록된 이미지가 있다면 그걸 사용
        const imgPath = req.file
            ? (req.fullImagePath || `images/item_IMG/${req.file.filename}`)
            : null;
        const fileName = result[0].img ? result[0].img : 'images/administrator_didnt_post_picture.png'; // img에는 이미지 경로까지 포함해서 저장하기에 주의
        const imagePath = path.join(__dirname, '../public/', fileName);
        //console.log('이미지 어디에있나: ', imagePath); //디버깅용 로그
        // 파일 존재 확인
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).send('이미지 파일이 존재하지 않습니다.');\
        }
    });
});

//wrongAccess.ejs의 귀신 사진 요청 api
router.get('/dokonikurunokai', (req, res) => {
        const imagePath = path.join(__dirname, '../public/images/어딜오는거야.jpg');
        if (fs.existsSync(imagePath)) {
            res.sendFile(imagePath);
        } else {
            res.status(404).send('이미지 파일이 존재하지 않습니다.');
        }
});

module.exports = router;