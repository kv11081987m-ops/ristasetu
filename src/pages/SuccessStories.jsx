import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';

const SuccessStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalConfirmed, setTotalConfirmed] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        const pubQ = query(
          collection(db, 'success_stories'),
          where('status', '==', 'approved'),
          where('isPublic', '==', true),
          orderBy('approvedAt', 'desc')
        );
        const pubSnap = await getDocs(pubQ);
        setStories(pubSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const allQ = query(collection(db, 'success_stories'), where('status', '==', 'approved'));
        const allSnap = await getDocs(allQ);
        setTotalConfirmed(allSnap.size);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl page-transition">
      {/* Header */}
      <div className="text-center mb-8">
        <div style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>💍</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">RistaSetu ke Rishtey</h1>
        <p className="text-gray-500 text-sm">Inhi logo ne yahan se apna jeevan saathi paya</p>
        {totalConfirmed > 0 && (
          <div className="inline-block mt-4 bg-red-50 text-red-600 font-bold px-5 py-2 rounded-full border border-red-200 text-sm">
            🎊 {totalConfirmed} Rishtey RistaSetu se Hue!
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Stories load ho rahi hain...</div>
      ) : stories.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 font-medium">Abhi tak koi public story nahi hai.</p>
          <p className="text-gray-400 text-sm mt-1">Pehli kahani aap sunao!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {stories.map(story => (
            <div key={story.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {story.photoUrl ? (
                  <img
                    src={story.photoUrl}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-red-100"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0 border-2 border-red-100" style={{ fontSize: '1.75rem' }}>
                    💑
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-gray-800 text-lg">{story.name1} &amp; {story.name2}</span>
                    <ShieldCheck size={16} className="text-green-500 flex-shrink-0" />
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    {[story.city, story.year].filter(Boolean).join(' • ')}
                  </div>
                  <p className="text-gray-600 leading-relaxed italic text-sm">"{story.story}"</p>
                  <div className="mt-3 flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <span key={i} style={{ fontSize: '0.9rem' }}>⭐</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link to="/dashboard" className="text-red-600 font-bold hover:underline text-sm">
          ← Apna rishta dhundhne wapas jaayein
        </Link>
      </div>
    </div>
  );
};

export default SuccessStories;
