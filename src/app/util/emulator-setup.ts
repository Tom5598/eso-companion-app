import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { environment } from "../env/environment";
import { AngularFireFunctions } from '@angular/fire/compat/functions';

export function connectFirebaseEmulators(
    auth: AngularFireAuth,
    firestore: AngularFirestore,
    storage: AngularFireStorage,
    functions: AngularFireFunctions
    ){
        return ()=> {
            if(!environment.useEmulators) return;
            auth.useEmulator('http://localhost:9099');
            firestore.firestore.useEmulator('localhost', 8080);
            storage.storage.useEmulator('localhost', 9199);
            functions.useEmulator('localhost', 5001);
        }   
}