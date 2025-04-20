export function convertSnapsToType<T>(snaps:any){
    return <T[]>snaps.docs.map((doc:any) => {         
        return {
            id: doc.id,
            ...<any>doc.data()
        };
    });
}