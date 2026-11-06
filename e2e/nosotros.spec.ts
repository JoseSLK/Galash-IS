import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', route => route.fulfill({ status: 401 }));
});

test('public universe content is reachable, responsive, keyboard operable and accessible', async ({ page }, info) => {
  test.setTimeout(60000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/nosotros');
  await expect(page.getByRole('heading', { name: 'Grupo de investigación en', exact: true })).toBeVisible();
  for (const id of ['mision-vision', 'objetivos', 'galeria', 'areas', 'enlaces', 'colaborar']) {
    await expect(page.locator('#' + id).getByRole('heading', { level: 2 })).toHaveCount(1);
  }
  await expect(page.locator('.hero-foot, .hero-copy .u-actions, .hero-copy > p, .u-section > .u-label, .area-callout .u-label')).toHaveCount(0);
  await expect(page.locator('.hero-emblem img')).toHaveAttribute('src', '/assets/galash-emblema-sin-fondo.svg');
  await expect(page.locator('.universe-mark')).toHaveCount(0);
  await expect(page.locator('#objetivos .animated-purpose-icon')).toHaveCount(3);
  await expect(page.locator('#mision-vision .animated-purpose-icon')).toHaveCount(1);
  const heroHeight = await page.locator('.universe-hero').evaluate(el => el.getBoundingClientRect().height);
  if(page.viewportSize()!.width >= 768) expect(heroHeight).toBeLessThanOrEqual(page.viewportSize()!.height - 63);
  const heroBounds = await page.locator('.universe-hero').boundingBox();
  for (const selector of ['.acronym-copy', '.hero-emblem img']) { const bounds=await page.locator(selector).boundingBox(); expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(heroBounds!.y+heroBounds!.height); }
  await expect(page.locator('.gallery-window')).toHaveCSS('overflow-x','hidden');
  await expect(page.locator('.area-callout').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(page.locator('.letter-button')).toHaveText(['G', 'A', 'L', 'A', 'S', 'H']);
  await expect(page.locator('app-nosotros-que-es, #que-es, .changing-word')).toHaveCount(0);
  await page.getByRole('button', { name: 'Visión', exact: true }).click();
  await expect(page.locator('.purpose-current')).toHaveText('Visión');
  await expect(page.locator('.gallery-group').first().locator('img')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: /Cada paso abre/ })).toHaveCount(0);
  await page.locator('#galeria').scrollIntoViewIfNeeded();
  await expect.poll(() => page.locator('.gallery-group').first().locator('img').evaluateAll(images => images.every(img => (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.area-callout')).toHaveCount(4);
  await expect(page.locator('.area-connections')).toHaveCount(0);
  await expect(page.locator('.photo-frame').first()).toHaveCSS('border-radius', '18px');
  const photoSize = await page.locator('.photo-frame img').first().boundingBox();
  expect(photoSize!.height).toBeGreaterThan(300);
  await expect(page.locator('.site-logo img')).toHaveAttribute('src', '/assets/galash-emblema-nav-96.webp');
  const iconShapes = await page.locator('#objetivos svg').evaluateAll(nodes => nodes.map(node => node.innerHTML));
  expect(new Set(iconShapes).size).toBe(3);
  await expect(page.locator('#areas app-institutional-icon')).toHaveCount(4);
  await expect(page.locator('app-nosotros-hero canvas')).toHaveCSS('mask-image', /linear-gradient/);
  await expect(page.locator('#areas').getByRole('img', { name: 'Emblema de GALASH' })).toHaveAttribute('src', '/assets/galash-emblema-sin-fondo.svg');
  const alpha = await page.locator('#areas').getByRole('img', { name: 'Emblema de GALASH' }).evaluate(el => {
    const image = el as HTMLImageElement; const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!; context.drawImage(image, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    return { corner: data[3], hasLines: data.some((value, index) => index % 4 === 3 && value > 0) };
  });
  expect(alpha).toEqual({ corner: 0, hasLines: true });
  const email = page.getByRole('textbox', { name: 'Tu correo electrónico' });
  await email.fill('invalido'); await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(email).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#collab-result')).toContainText('válido');
  const transmissions: string[] = [];
  page.on('request', request => { if (request.method() !== 'GET') transmissions.push(request.url()); });
  await email.fill('ejemplo@example.test'); await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.locator('#collab-result')).toContainText('no se ha enviado');
  expect(transmissions).toEqual([]);
  await expect(page.getByRole('heading', { name: 'Dónde nos encontramos' })).toHaveCount(1);
  await expect(page.locator('.location-map')).toHaveAttribute('src', /google.com\/maps\?q=.+output=embed/);
  await expect(page.locator('.location-copy address')).toContainText('15-134');
  await expect(page.locator('.location-copy .official-entry')).toHaveCount(4);
  await expect(page.locator('.location-copy .official-entry strong')).toHaveText(['Instagram', 'Facebook', 'CvLAC', 'GrupLAC']);
  await expect(page.locator('#enlaces')).not.toContainText('GALASH en comunidad');
  await expect(page.locator('#enlaces')).not.toContainText('Minciencias');
  await expect(page.locator('#enlaces')).not.toContainText('Repositorios');
  await expect(page.locator('#enlaces .u-card')).toHaveCount(0);
  await expect(page.locator('app-nosotros-indice, .reading-progress, .editorial-note, app-nosotros-semilleros, app-nosotros-equipo')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Ver semilleros', exact: true })).toHaveCount(0);
  const audit = await new AxeBuilder({ page }).include('main#contenido').withTags(['wcag2a','wcag2aa']).analyze();
  expect(audit.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target).join(', ')}`)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('heading', { name: 'Grupo de investigación en', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('hero.png'), fullPage: false });
  await page.locator('#areas').scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('areas.png') });
});

test('constellation loops continuously including reduced-motion mode while other motion remains reduced', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/nosotros');
  const canvas = page.locator('app-nosotros-hero canvas');
  await expect(canvas).toBeVisible();
  const image = () => canvas.evaluate(el => (el as HTMLCanvasElement).toDataURL());
  const first = await image();
  await expect.poll(image).not.toBe(first);
  await expect(page.locator('.changing-word')).toHaveCount(0);
});

test('Nosotros navigation remains wired to its public route', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.menu-toggle');
  if (await toggle.isVisible()) await toggle.click();
  await page.locator('#site-navigation').getByRole('link', { name: 'Nosotros', exact: true }).click();
  await expect(page).toHaveURL(/\/nosotros$/);
  await expect(page.getByRole('heading', { name: 'Grupo de investigación en', exact: true })).toBeVisible();
});


test('purpose carousel advances automatically and reveals its words from grey to white', async ({ page }) => {
  test.setTimeout(40000);
  await page.goto('/nosotros');
  await page.locator('.purpose-carousel').scrollIntoViewIfNeeded();
  const stage = await page.locator('.purpose-carousel').boundingBox();
  await page.mouse.move(stage!.x + stage!.width / 2, stage!.y + stage!.height / 2);
  await expect(page.locator('.purpose-current')).toHaveText('Misión');
  await expect.poll(() => page.locator('.purpose-word.is-lit').count()).toBeGreaterThan(0);
  await expect(page.locator('.purpose-word').first()).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.purpose-word').last()).not.toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(page.locator('.purpose-word').last()).toHaveCSS('color', 'rgb(255, 255, 255)', { timeout: 10000 });
  await expect(page.locator('.purpose-current')).toHaveText('Misión');
  await expect(page.locator('.purpose-current')).toHaveText('Visión', { timeout: 12000 });
  await expect(page.locator('.purpose-pagination button')).toHaveCount(2);
  await expect(page.locator('#objetivos li')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Objetivos', exact: true })).toHaveCount(0);
});

test('gallery slides automatically and can be paused while distinct icons animate', async ({page}) => {
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/nosotros');
 await page.locator('#galeria').scrollIntoViewIfNeeded();
 await page.mouse.move(0,0);
 const track=page.locator('.gallery-strip');
 await page.locator('.gallery-window').hover();
 const initial=await track.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41);
 await page.waitForTimeout(700);
 expect(await track.evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41)).toBeLessThan(initial);
 const cards=await page.locator('.gallery-group').first().locator('figure').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().y));
 expect(cards[1]).toBeGreaterThan(cards[0]+50);
 expect(cards[2]).toBeCloseTo(cards[0],0);
 await page.getByRole('button',{name:'Pausar galería',exact:true}).click();
 const before=await track.evaluate(el=>getComputedStyle(el).transform);
 await page.mouse.move(0,0);await page.waitForTimeout(700);
 expect(await track.evaluate(el=>getComputedStyle(el).transform)).toBe(before);
 await expect(page.getByRole('button',{name:'Reanudar galería',exact:true})).toHaveAttribute('aria-pressed','true');
 const areaParts=page.locator('#areas .moving');
 await expect(areaParts).toHaveCount(4);
 for(const part of await areaParts.all()) await expect(part).toHaveCSS('animation-name',/icon-motion$/);
 const areaBefore=await areaParts.evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
 await page.waitForTimeout(500);
 const areaAfter=await areaParts.evaluateAll(els=>els.map(el=>getComputedStyle(el).transform));
 for(let i=0;i<4;i++) expect(areaAfter[i]).not.toBe(areaBefore[i]);
 await page.emulateMedia({reducedMotion:'no-preference'});
 const part=page.locator('#objetivos .moving').first();
 await expect(part).toHaveCSS('animation-name',/icon-motion$/);
 const transform=await part.evaluate(el=>getComputedStyle(el).transform);
 await page.waitForTimeout(350);
 expect(await part.evaluate(el=>getComputedStyle(el).transform)).not.toBe(transform);
});

test('interactive hero supports manual letters, keyboard, motion preference and automatic cycle',async({page})=>{
 test.setTimeout(45000);
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/nosotros');
 const hero=page.locator('app-hero-acronimo');const card=hero.locator('.letter-card');
 await expect(hero.getByRole('button',{name:'Auditoría',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(hero.getByRole('button',{name:'Reproducir',exact:true})).toBeVisible();
 await expect(card).toHaveAttribute('aria-live','polite');
 await hero.getByRole('button',{name:'Hardware',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(card.getByRole('heading')).toHaveText('Hardware');
 await hero.getByRole('button',{name:'Grupo',exact:true}).focus();await page.keyboard.press('Space');
 await expect(card.getByRole('heading')).toHaveText('Grupo');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await hero.getByRole('button',{name:'Pausar',exact:true}).focus();await page.mouse.move(0,0);
 await expect(card.getByRole('heading')).toHaveText('Auditoría',{timeout:5000});
 await expect(card).toHaveAttribute('aria-live','off');
 await hero.locator('.letter-card').hover();const current=await card.getByRole('heading').textContent();
 await page.waitForTimeout(3300);expect(await card.getByRole('heading').textContent()).toBe(current);
 await page.mouse.move(0,0);await expect(card.getByRole('heading')).not.toHaveText(current!,{timeout:5000});
 await hero.getByRole('button',{name:'Pausar',exact:true}).click();const stopped=await card.getByRole('heading').textContent();
 await page.waitForTimeout(3300);expect(await card.getByRole('heading').textContent()).toBe(stopped);
 await expect(card).toHaveAttribute('aria-live','polite');
});
