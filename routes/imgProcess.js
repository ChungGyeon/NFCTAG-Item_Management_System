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
        if (!req.file && !req.body.itemName) { //이미지랑 수정된 이름 둘다 제공 x시
            return res.status(400).json({
                success: false,
                error: "이미지와 수정된 이름이 제공되지 않았습니다."
            });
        }
        const updateData = {};
        if (req.file) updateData.img = req.file.filename;
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


// 관리자 물건 추가 라우트
router.post('/addItem', upload.single('itemImg'), (req, res) => {
    const { itemName } = req.body;
    const itemImg = req.file;

    if (!itemName || !itemImg) {
        return res.status(400).json({ message: '아이템 이름과 이미지가 필요합니다.' });
    }

    const sql = 'INSERT INTO Items (itemName, img, status) VALUES (?, ?, 0)';
    db.query(sql, [itemName, itemImg.filename], (err, result) => {
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
                console.log('DB 삭제 오류: ',error);
                return res.status(500).json({
                    success: false,
                    message: 'DB 삭제 오류'
                });
            }

            //삭제 로직
            result.forEach(row => {
                if(row.img){
                    const imgPath = path.join(__dirname, '../public/images', row.img);
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


module.exports = router;