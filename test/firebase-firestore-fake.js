// Testvervanger voor firebase-firestore-compat.js: praat met de lokale
// testserver (server.js) in plaats van met echte Firestore, omdat de
// Firestore-emulator hier geen bestanden kan downloaden. Dekt het stukje
// API dat priodis.html gebruikt: enablePersistence, useEmulator,
// collection(x).doc(y).get()/.set()/.update()/.delete(), doc(y).collection(z)
// voor deelverzamelingen, collection().onSnapshot() (via polling) en batch().
(function(){
  window.firebase = window.firebase || {};

  function encodePath(p){
    return p.split("/").map(encodeURIComponent).join("/");
  }

  function makeDocRef(p){
    var url = "/fsfake/" + encodePath(p);
    return {
      path: p,
      id: p.split("/").pop(),
      get: function(){
        return fetch(url).then(function(r){
          if(r.status === 404){
            return { exists:false, data:function(){ return undefined; } };
          }
          return r.json().then(function(data){
            return { exists:true, data:function(){ return data; } };
          });
        });
      },
      set: function(data, opts){
        return fetch(url, {
          method:"PUT",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ data:data, merge: !!(opts && opts.merge) })
        }).then(function(r){
          if(!r.ok) throw new Error("opslaan mislukt");
        });
      },
      update: function(data){
        return fetch(url, {
          method:"PUT",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ data:data, merge:true })
        }).then(function(r){
          if(!r.ok) throw new Error("bijwerken mislukt");
        });
      },
      delete: function(){
        return fetch(url, { method:"DELETE" }).then(function(r){
          if(!r.ok) throw new Error("verwijderen mislukt");
        });
      },
      collection: function(sub){
        return makeCollectionRef(p + "/" + sub);
      }
    };
  }

  var autoIdCounter = 0;

  function makeCollectionRef(p){
    var listUrl = "/fsfake-collection/" + encodePath(p);
    return {
      path: p,
      doc: function(id){ return makeDocRef(p + "/" + id); },
      add: function(data){
        autoIdCounter++;
        var id = "auto" + Date.now() + "_" + autoIdCounter;
        var ref = makeDocRef(p + "/" + id);
        return ref.set(data).then(function(){ return ref; });
      },
      get: function(){
        return fetch(listUrl).then(function(r){ return r.json(); }).then(function(json){
          return {
            docs: json.docs.map(function(d){
              return { id: d.id, data: function(){ return d.data; } };
            })
          };
        });
      },
      onSnapshot: function(onNext, onError){
        var stopped = false;
        var lastSerialized = null;
        function poll(){
          if(stopped) return;
          fetch(listUrl).then(function(r){ return r.json(); }).then(function(json){
            var serialized = JSON.stringify(json);
            if(serialized !== lastSerialized){
              lastSerialized = serialized;
              onNext({
                docs: json.docs.map(function(d){
                  return { id: d.id, data: function(){ return d.data; } };
                })
              });
            }
          }).catch(function(err){
            if(onError) onError(err);
          }).then(function(){
            if(!stopped) setTimeout(poll, 200);
          });
        }
        poll();
        return function unsubscribe(){ stopped = true; };
      }
    };
  }

  firebase.firestore = function(){
    return {
      enablePersistence: function(){ return Promise.resolve(); },
      useEmulator: function(){ /* niet nodig, fake praat altijd met dezelfde server */ },
      collection: function(name){ return makeCollectionRef(name); },
      batch: function(){
        var ops = [];
        return {
          set: function(ref, data){ ops.push({ type:"set", ref:ref, data:data }); },
          update: function(ref, data){ ops.push({ type:"update", ref:ref, data:data }); },
          delete: function(ref){ ops.push({ type:"delete", ref:ref }); },
          commit: function(){
            return Promise.all(ops.map(function(op){
              if(op.type === "set") return op.ref.set(op.data);
              if(op.type === "update") return op.ref.update(op.data);
              return op.ref.delete();
            }));
          }
        };
      }
    };
  };
})();
