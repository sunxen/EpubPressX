import { assert } from 'chai';
import fetchMock from 'fetch-mock';
import EpubPress from '../epub-press.js';

const MOCK_SECTIONS = [{
    url: 'https://epub.press',
    html: '<html></html>',
}, {
    url: 'https://google.com',
    html: '<html></html>',
}];

const MOCK_BOOK_DATA = {
    title: 'Title',
    description: 'Description',
    sections: MOCK_SECTIONS,
};

const getMockBook = (props) => {
    const defaults = MOCK_BOOK_DATA;
    return Object.assign({}, defaults, props);
};

describe('EpubPressJS', () => {
    describe('data', () => {
        it('can be created with sections', () => {
            const props = getMockBook();
            const book = new EpubPress(props);
            const urls = book.getUrls();

            assert.include(urls, 'https://epub.press');
            assert.include(urls, 'https://google.com');
        });

        it('can be created with urls', () => {
            const props = getMockBook({
                sections: undefined,
                urls: MOCK_SECTIONS.map(s => s.url),
            });
            const book = new EpubPress(props);
            const urls = book.getUrls();

            assert.include(urls, 'https://epub.press');
            assert.include(urls, 'https://google.com');
        });

        it('can return the title', () => {
            const props = getMockBook({ title: 'A title' });
            const book = new EpubPress(props);

            assert.equal(book.getTitle(), 'A title');
        });

        it('can return a description', () => {
            const props = getMockBook({ description: 'Hello world' });
            const book = new EpubPress(props);

            assert.equal(book.getDescription(), props.description);
        });

        it('has a download url', () => {
            const book = new EpubPress(getMockBook());
            book.bookData.id = 1;

            const downloadUrl = book.getDownloadUrl();
            assert.equal(downloadUrl, `${EpubPress.BASE_URL}/api/books/download?id=1`);
        });
    });

    describe('api', () => {
        const MOCK_RESPONSE = {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
            },
            body: { id: 1 },
        };

        it('posts section data to EpubPress', (done) => {
            const props = getMockBook();
            const book = new EpubPress(props);
            const PUBLISH_URL = book.getPublishUrl();

            fetchMock.mock(PUBLISH_URL, 'POST', MOCK_RESPONSE);

            book.publish().then(() => {
                assert.isTrue(fetchMock.called(PUBLISH_URL));
                assert.equal(fetchMock.lastUrl(PUBLISH_URL), PUBLISH_URL);
                assert.deepEqual(JSON.parse(fetchMock.lastOptions(PUBLISH_URL).body), props);
                assert.equal(book.getId(), 1);
                done();
            }).catch(done);
        });

        it('downloads books from EpubPress', (done) => {
            const props = getMockBook({ id: 1 });
            const book = new EpubPress(props);
            const DOWNLOAD_URL = book.getDownloadUrl();

            fetchMock.mock(DOWNLOAD_URL, 'GET');

            book.download().then(() => {
                assert.isTrue(fetchMock.called(DOWNLOAD_URL));
                assert.equal(fetchMock.lastUrl(DOWNLOAD_URL), DOWNLOAD_URL);
                done();
            }).catch(done);
        });
    });
});
