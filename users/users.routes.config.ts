import { CommonRoutesConfig } from '../common/common.routes.config';
import UsersController from './controllers/users.controller';
import UsersMiddleware from './middleware/users.middleware';
import express from 'express';
import BodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import { body } from 'express-validator';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import permissionMiddleware from '../common/middleware/common.permission.middleware';
import { PermissionFlag } from '../common/middleware/common.permissionflag.enum';

import {swaggerDocs} from '../app';
import swaggerUI from 'swagger-ui-express';


export class UsersRoutes extends CommonRoutesConfig {

    constructor(app: express.Application) {
        super(app, 'UsersRoutes');
    }

    configureRoutes() {

    this.app.use('/api-docs',swaggerUI.serve,swaggerUI.setup(swaggerDocs));
    
      /*   this.app
            .route(`/users`)
            .get(
        jwtMiddleware.validJWTNeeded,
        permissionMiddleware.permissionFlagRequired(
            PermissionFlag.ADMIN_PERMISSION
        ),
        UsersController.listUsers
    ) */
        /** 
        * @swagger 
        * /users: 
        *   get: 
        *     description: Get all users 
        *     responses:  
        *       200:
        *         description: Success
        *   post:
        *     description: add a user 
        *     parameters:
        *       - name: email
        *         in: body
        *         type: string
        *       - name: password
        *         in: body
        *         type: string
        *     responses:  
        *      200:
        *         description: Success
        */

        this.app
            .route(`/users`)

            .get(UsersController.listUsers)
            .post(
                body('email').isEmail(),
                body('password')
                    .isLength({ min: 5 })
                    .withMessage('Must include password (5+ characters)'),
                BodyValidationMiddleware.verifyBodyFieldsErrors,
                UsersMiddleware.validateSameEmailDoesntExist,
                UsersController.createUser
            );

        /** 
        * @swagger 
        * /users/:{userId}: 
        *   get: 
        *     description: Returns the information of the user with that id
        *     responses:  
        *       200:
        *         description: Success
        *     parameters:
        *       - name: userId
        *         in: path
        *         type: string
        *   delete: 
        *     description: delete the user with that id
        *     responses:  
        *       200:
        *         description: Success
        *     parameters:
        *       - name: userId
        *         in: query
        *         type: string      
        *   put: 
        *     description: Updates the information of the user with that id
        *     responses:  
        *       200:
        *         description: Success
        *     parameters:
        *       - name: userId
        *         in: query
        *         type: string
        *       - name: email
        *         type: string
        *       - name: password
        *         type: string
        *       - name: firstname
        *         type: string
        *       - name: lastname
        *         type: string
        *       - name:permissionFlag
        *         type:number
        *   patch: 
        *     description: Updates the desired part of the information of the user who has that id 
        *     responses:  
        *       200:
        *         description: Success
        *     parameters:
        *       - name: userId
        *         in: query
        *         type: string
        */
        this.app.param(`userId`, UsersMiddleware.extractUserId);
        this.app
            .route(`/users/:userId`)
            .all(
                UsersMiddleware.validateUserExists,
                jwtMiddleware.validJWTNeeded,
                permissionMiddleware.onlySameUserOrAdminCanDoThisAction
                )
            .get(UsersController.getUserById)
            .delete(UsersController.removeUser);

       
        this.app.put(`/users/:userId`, [
            body('email').isEmail(),
            body('password')
                .isLength({ min: 5 })
                .withMessage('Must include password (5+ characters)'),
            body('firstName').isString(),
            body('lastName').isString(),
            body('permissionFlags').isInt(),
            BodyValidationMiddleware.verifyBodyFieldsErrors,
            UsersMiddleware.validateSameEmailBelongToSameUser,
            UsersMiddleware.userCantChangePermission,
            permissionMiddleware.permissionFlagRequired(
                PermissionFlag.PAID_PERMISSION
            ),
            UsersController.put,
        ]);

        this.app.patch(`/users/:userId`, [
            body('email').isEmail().optional(),
            body('password')
                .isLength({ min: 5 })
                .withMessage('Password must be 5+ characters')
                .optional(),
            body('firstName').isString().optional(),
            body('lastName').isString().optional(),
            body('permissionFlags').isInt().optional(),
            BodyValidationMiddleware.verifyBodyFieldsErrors,
            
            UsersMiddleware.validatePatchEmail,
            UsersMiddleware.userCantChangePermission,
            permissionMiddleware.permissionFlagRequired(
                PermissionFlag.PAID_PERMISSION
            ),
            UsersController.patch,
        ]);

        /** 
        * @swagger 
        * /users/:userId/permissionFlags/:permissionFlags: 
        *   put: 
        *     description: Updates the information of the user with that id
        *     responses:  
        *       200:
        *         description: Success
        */
        



        this.app.put(`/users/:userId/permissionFlags/:permissionFlags`, [
            jwtMiddleware.validJWTNeeded,
            permissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        
            // Note: The above two pieces of middleware are needed despite
            // the reference to them in the .all() call, because that only covers
            // /users/:userId, not anything beneath it in the hierarchy
        
            permissionMiddleware.permissionFlagRequired(
                PermissionFlag.FREE_PERMISSION
            ),
            UsersController.updatePermissionFlags,
        ]);
        return this.app;
    }
}
